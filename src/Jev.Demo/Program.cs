using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using Jev.Demo;

var envFile = DotEnv.Load(Directory.GetCurrentDirectory());

var builder = WebApplication.CreateBuilder(args);
builder.Services.Configure<SponsorOptions>(builder.Configuration.GetSection("Sponsors"));
builder.Services.ConfigureHttpJsonOptions(json => json.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddHttpClient<OpenRouterClient>(http => http.Timeout = TimeSpan.FromSeconds(60));

var app = builder.Build();
app.Logger.LogInformation("Environment file: {EnvFile}. OpenRouter key present: {HasKey}. Jev model: {Model}.",
    envFile ?? "none found", OpenRouterClient.ApiKey is not null, OpenRouterClient.JevModel);

app.UseDefaultFiles();
// Never cache: an edited slide or a newly dropped sponsor logo must show on the next refresh.
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = context => context.Context.Response.Headers.CacheControl = "no-store",
});

// Everything the deck needs to render: the talk, the speaker, the sponsors and what is wired up.
app.MapGet("/api/config", (IConfiguration configuration, IWebHostEnvironment environment,
    Microsoft.Extensions.Options.IOptionsSnapshot<SponsorOptions> sponsors) => Results.Json(new
{
    talk = configuration.GetSection("Talk").Get<TalkOptions>() ?? new TalkOptions(),
    sponsors = new
    {
        heading = sponsors.Value.Heading,
        secondsPerLogo = sponsors.Value.SecondsPerLogo,
        items = SponsorCatalog.Discover(environment.WebRootPath, sponsors.Value),
    },
    jev = new
    {
        ready = OpenRouterClient.ApiKey is not null,
        model = OpenRouterClient.JevModel,
        compareModel = OpenRouterClient.CompareModel,
    },
}));

// Ask Jev anything: the deck sends the state and the typed questions, the key never leaves the server.
app.MapPost("/api/decide", (DecideRequest request, OpenRouterClient jev, CancellationToken cancellation) =>
    Guard(async () => Results.Json(await jev.DecideAsync(request.State, request.Questions, cancellation))));

// The same question to Jev and to a general chat model, side by side.
app.MapPost("/api/race", (DecideRequest request, OpenRouterClient openRouter, CancellationToken cancellation) =>
    Guard(async () =>
    {
        var jev = openRouter.DecideAsync(request.State, request.Questions, cancellation);
        var llm = openRouter.ChatAsync(request.State, request.Questions, cancellation);
        await Task.WhenAll(jev, llm);
        return Results.Json(new { jev = await jev, llm = await llm });
    }));

// The type-safe example from the slides: enums in, enums out.
app.MapPost("/api/triage", (TriageRequest request, OpenRouterClient jev, CancellationToken cancellation) =>
    Guard(async () =>
    {
        var decision = await jev.DecideAsync(
            new { customerMessage = request.Message },
            new Dictionary<string, object>
            {
                ["department"] = Question.Choice<Department>("Which team should handle this message?"),
                ["urgency"] = Question.Score("How urgent is this message?",
                    "Can wait: a question or a suggestion",
                    "Soon: the customer is inconvenienced",
                    "Now: the customer is blocked or losing money"),
                ["wantsRefund"] = Question.YesNo("Is the customer asking for their money back?",
                    yes: "They ask for a refund, a reversal or a chargeback",
                    no: "They do not ask for money back"),
            },
            cancellation);

        var typed = new TriageDecision(
            decision.Choice<Department>("department"),
            decision.Score("urgency"),
            decision.Probability("wantsRefund"));

        return Results.Json(new { typed, raw = decision });
    }));

app.Run();

static async Task<IResult> Guard(Func<Task<IResult>> action)
{
    try
    {
        return await action();
    }
    catch (OpenRouterException failure)
    {
        return Results.Json(new { error = failure.Message }, statusCode: failure.Status);
    }
}

public sealed record DecideRequest(JsonNode State, JsonObject Questions);

public sealed record TriageRequest(string Message);

public sealed class TalkOptions
{
    public string Title { get; set; } = "";
    public string Subtitle { get; set; } = "";
    public string Event { get; set; } = "";
    public SpeakerOptions Speaker { get; set; } = new();
}

public sealed class SpeakerOptions
{
    public string Name { get; set; } = "";
    public string Photo { get; set; } = "";
    public List<RoleOptions> Roles { get; set; } = [];
    public List<string> Links { get; set; } = [];
}

// One position the speaker holds, listed in the order the deck shows them.
public sealed class RoleOptions
{
    public string Title { get; set; } = "";
    public string Company { get; set; } = "";
    public string Since { get; set; } = "";
    public string About { get; set; } = "";
}

public partial class Program;
