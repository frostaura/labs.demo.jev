using System.Diagnostics;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Jev.Demo;

public sealed class OpenRouterException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}

/// <summary>
/// Calls Jev directly through OpenRouter's Decisions API (not the Jev Router), plus a plain
/// chat completion used only to race an LLM against Jev on the same question.
/// Every successful answer is kept on disk so a dropped connection mid-talk replays the last
/// real answer — clearly flagged as cached — instead of an error.
/// </summary>
public sealed class OpenRouterClient(HttpClient http, IHostEnvironment environment, ILogger<OpenRouterClient> logger)
{
    private const string DecisionsUrl = "https://openrouter.ai/api/alpha/decisions";
    private const string ChatUrl = "https://openrouter.ai/api/v1/chat/completions";
    private static readonly JsonSerializerOptions Web = new(JsonSerializerDefaults.Web);

    private readonly string _cacheDirectory = Path.Combine(environment.ContentRootPath, ".cache");

    public static string? ApiKey => NullIfBlank(Environment.GetEnvironmentVariable("OPENROUTER_API_KEY"));
    public static string JevModel => NullIfBlank(Environment.GetEnvironmentVariable("JEV_MODEL")) ?? "typesafe/jev-1.14";
    public static string? CompareModel => NullIfBlank(Environment.GetEnvironmentVariable("COMPARE_MODEL"));

    /// <summary>Asks Jev one or more typed questions about a piece of state.</summary>
    public async Task<JsonObject> DecideAsync(object state, object questions, CancellationToken cancellation)
    {
        var request = new JsonObject
        {
            ["model"] = JevModel,
            ["state"] = JsonSerializer.SerializeToNode(state, Web),
            ["questions"] = JsonSerializer.SerializeToNode(questions, Web),
        };

        var (upstream, latencyMs, cached, liveError) = await SendAsync(DecisionsUrl, request, cancellation);
        return new JsonObject
        {
            ["model"] = upstream["model"]?.DeepClone() ?? JevModel,
            ["answers"] = upstream["answers"]?.DeepClone(),
            ["usage"] = upstream["usage"]?.DeepClone(),
            ["latencyMs"] = latencyMs,
            ["cached"] = cached,
            ["liveError"] = liveError,
            ["request"] = request,
        };
    }

    /// <summary>Asks a general chat model the same thing, the way you would without a decision model.</summary>
    public async Task<JsonObject> ChatAsync(object state, object questions, CancellationToken cancellation)
    {
        var model = CompareModel ?? throw new OpenRouterException(503, "COMPARE_MODEL is not set in .env.");
        var prompt =
            "Here is some state:\n" + JsonSerializer.Serialize(state, Web) +
            "\n\nAnswer these questions about it:\n" + JsonSerializer.Serialize(questions, Web) +
            "\n\nReply with JSON only: one key per question, each value being the chosen option.";
        var request = new JsonObject
        {
            ["model"] = model,
            ["messages"] = new JsonArray(
                new JsonObject { ["role"] = "system", ["content"] = "You are a careful classifier. Reply with JSON only." },
                new JsonObject { ["role"] = "user", ["content"] = prompt }),
        };

        var (upstream, latencyMs, cached, liveError) = await SendAsync(ChatUrl, request, cancellation);
        return new JsonObject
        {
            ["model"] = upstream["model"]?.DeepClone() ?? model,
            ["text"] = upstream["choices"]?[0]?["message"]?["content"]?.DeepClone(),
            ["usage"] = upstream["usage"]?.DeepClone(),
            ["latencyMs"] = latencyMs,
            ["cached"] = cached,
            ["liveError"] = liveError,
        };
    }

    private async Task<(JsonObject Upstream, double LatencyMs, bool Cached, string? LiveError)> SendAsync(
        string url, JsonObject request, CancellationToken cancellation)
    {
        var body = request.ToJsonString();
        var cacheFile = Path.Combine(_cacheDirectory,
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(url + body))) + ".json");

        try
        {
            var key = ApiKey ?? throw new OpenRouterException(503,
                "OPENROUTER_API_KEY is not set. Add it to the .env file at the repository root and restart.");

            using var message = new HttpRequestMessage(HttpMethod.Post, url);
            message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", key);
            message.Content = new StringContent(body, Encoding.UTF8, "application/json");

            var clock = Stopwatch.StartNew();
            using var response = await http.SendAsync(message, cancellation);
            var text = await response.Content.ReadAsStringAsync(cancellation);
            var latencyMs = Math.Round(clock.Elapsed.TotalMilliseconds, 1);

            if (!response.IsSuccessStatusCode)
                throw new OpenRouterException((int)response.StatusCode, DescribeError(text, (int)response.StatusCode));

            var upstream = JsonNode.Parse(text) as JsonObject
                ?? throw new OpenRouterException(502, "OpenRouter returned a response that is not a JSON object.");

            Directory.CreateDirectory(_cacheDirectory);
            await File.WriteAllTextAsync(cacheFile,
                new JsonObject { ["latencyMs"] = latencyMs, ["upstream"] = upstream.DeepClone() }.ToJsonString(),
                cancellation);
            return (upstream, latencyMs, false, null);
        }
        catch (Exception failure) when (failure is OpenRouterException or HttpRequestException or TaskCanceledException or JsonException)
        {
            if (cancellation.IsCancellationRequested || !File.Exists(cacheFile)) throw Normalise(failure);

            logger.LogWarning("Live call failed ({Reason}); replaying the last real answer from cache.", failure.Message);
            var saved = JsonNode.Parse(await File.ReadAllTextAsync(cacheFile, cancellation))!.AsObject();
            return (saved["upstream"]!.AsObject(), saved["latencyMs"]!.GetValue<double>(), true, failure.Message);
        }
    }

    private static Exception Normalise(Exception failure) => failure switch
    {
        OpenRouterException => failure,
        TaskCanceledException => new OpenRouterException(504, "OpenRouter did not answer in time."),
        _ => new OpenRouterException(502, $"Could not reach OpenRouter: {failure.Message}"),
    };

    private static string DescribeError(string text, int status)
    {
        try
        {
            var message = JsonNode.Parse(text)?["error"]?["message"]?.GetValue<string>();
            if (!string.IsNullOrWhiteSpace(message)) return $"OpenRouter {status}: {message}";
        }
        catch (Exception e) when (e is JsonException or InvalidOperationException)
        {
            // Not the documented error envelope — fall through to the raw status.
        }
        return $"OpenRouter returned HTTP {status}.";
    }

    private static string? NullIfBlank(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
