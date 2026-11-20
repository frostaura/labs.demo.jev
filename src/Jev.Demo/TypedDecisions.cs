using System.ComponentModel;
using System.Reflection;
using System.Text.Json.Nodes;

namespace Jev.Demo;

/// <summary>
/// The type-safe layer: questions are built from C# types, and answers come back as C# types.
/// A Choice over an enum can only ever be one of that enum's members.
/// </summary>
public static class Question
{
    /// <summary>A yes/no question. Jev answers with the probability of "yes".</summary>
    public static object YesNo(string instructions, string yes, string no) => new
    {
        type = "noul",
        instructions,
        criteria = new Dictionary<string, string> { ["true"] = yes, ["false"] = no },
    };

    /// <summary>Pick exactly one member of <typeparamref name="TEnum"/>. [Description] explains each option.</summary>
    public static object Choice<TEnum>(string instructions) where TEnum : struct, Enum => new
    {
        type = "choice",
        instructions,
        criteria = Enum.GetNames<TEnum>().ToDictionary(
            name => name,
            name => typeof(TEnum).GetField(name)!.GetCustomAttribute<DescriptionAttribute>()?.Description ?? name),
    };

    /// <summary>Place the state on an ordered scale, lowest level first.</summary>
    public static object Score(string instructions, params string[] levels) => new
    {
        type = "score",
        instructions,
        criteria = levels,
    };
}

public static class AnswerExtensions
{
    public static TEnum Choice<TEnum>(this JsonObject decision, string question) where TEnum : struct, Enum =>
        Enum.Parse<TEnum>(Answer(decision, question, "choice").GetValue<string>());

    public static double Probability(this JsonObject decision, string question) =>
        Answer(decision, question, "noul").GetValue<double>();

    public static double Score(this JsonObject decision, string question) =>
        Answer(decision, question, "score").GetValue<double>();

    private static JsonNode Answer(JsonObject decision, string question, string type) =>
        decision["answers"]?[question]?[type]
        ?? throw new OpenRouterException(502, $"Jev did not return a '{type}' answer for '{question}'.");
}

public enum Department
{
    [Description("Charges, invoices, refunds and payment problems")] Billing,
    [Description("Something is broken, slow, or not working as documented")] TechnicalSupport,
    [Description("Pricing questions, upgrades, or wanting to buy")] Sales,
    [Description("Login, password, profile and account access")] Account,
}

public sealed record TriageDecision(Department Department, double Urgency, double WantsRefund);
