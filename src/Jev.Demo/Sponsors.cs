namespace Jev.Demo;

public sealed class SponsorOptions
{
    public string Directory { get; set; } = "assets/sponsors";
    public string Heading { get; set; } = "With thanks to our sponsors";
    public double SecondsPerLogo { get; set; } = 4;
    public List<string> Exclude { get; set; } = [];
    public List<SponsorOverride> Overrides { get; set; } = [];
}

public sealed class SponsorOverride
{
    public string File { get; set; } = "";
    public string? Name { get; set; }
    public string? Url { get; set; }
    public int? Order { get; set; }
}

public sealed record Sponsor(string Name, string Image, string? Url);

public static class SponsorCatalog
{
    private static readonly HashSet<string> ImageExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif" };

    /// <summary>Every image in the sponsor directory, re-read on each call so new files appear on refresh.</summary>
    public static IReadOnlyList<Sponsor> Discover(string webRoot, SponsorOptions options)
    {
        var relative = options.Directory.Trim('/');
        var directory = Path.Combine(webRoot, relative);
        if (!System.IO.Directory.Exists(directory)) return [];

        var overrides = options.Overrides
            .Where(o => !string.IsNullOrWhiteSpace(o.File))
            .ToDictionary(o => o.File, StringComparer.OrdinalIgnoreCase);
        var excluded = new HashSet<string>(options.Exclude, StringComparer.OrdinalIgnoreCase);

        return System.IO.Directory.EnumerateFiles(directory)
            .Select(Path.GetFileName)
            .OfType<string>()
            .Where(file => ImageExtensions.Contains(Path.GetExtension(file)) && !excluded.Contains(file))
            .Select(file => (file, over: overrides.GetValueOrDefault(file)))
            .OrderBy(x => x.over?.Order ?? int.MaxValue)
            .ThenBy(x => x.file, StringComparer.OrdinalIgnoreCase)
            .Select(x => new Sponsor(
                x.over?.Name ?? PrettyName(x.file),
                $"{relative}/{Uri.EscapeDataString(x.file)}",
                x.over?.Url))
            .ToList();
    }

    private static string PrettyName(string file)
    {
        var name = Path.GetFileNameWithoutExtension(file).TrimStart("0123456789".ToCharArray());
        return name.Replace('-', ' ').Replace('_', ' ').Trim();
    }
}
