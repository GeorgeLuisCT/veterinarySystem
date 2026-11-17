using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace VetSaas.Shared.Infrastructure.Json;

/// <summary>
/// Fechas con hora sin zona («2026-01-31T10:30:00»), como las espera el frontend.
/// Si llega una con «Z» u offset se conserva la hora escrita y se descarta la zona.
/// </summary>
public sealed class LocalDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        string? text = reader.GetString();
        if (string.IsNullOrWhiteSpace(text)) throw new JsonException("Fecha y hora vacía.");
        if (DateTimeOffset.TryParse(text, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out DateTimeOffset withOffset))
            return DateTime.SpecifyKind(withOffset.DateTime, DateTimeKind.Unspecified);
        throw new JsonException($"Fecha y hora inválida: '{text}'.");
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        string format = value.Ticks % TimeSpan.TicksPerSecond == 0 ? "yyyy-MM-dd'T'HH:mm:ss" : "yyyy-MM-dd'T'HH:mm:ss.FFFFFF";
        writer.WriteStringValue(value.ToString(format, CultureInfo.InvariantCulture));
    }
}

/// <summary>
/// Campo opcional de un PATCH: distingue «no vino» de «vino en null» (equivale a JsonNullable del backend anterior).
/// </summary>
[JsonConverter(typeof(OptionalConverterFactory))]
public readonly struct Optional<T>
{
    private readonly T? _value;
    public bool IsPresent { get; }
    public Optional(T? value) { _value = value; IsPresent = true; }
    public T? Value => _value;
    public static Optional<T> Undefined => default;
    public static implicit operator Optional<T>(T? value) => new(value);
}

public sealed class OptionalConverterFactory : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert) =>
        typeToConvert.IsGenericType && typeToConvert.GetGenericTypeDefinition() == typeof(Optional<>);

    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options) =>
        (JsonConverter)Activator.CreateInstance(
            typeof(OptionalConverter<>).MakeGenericType(typeToConvert.GetGenericArguments()[0]))!;

    private sealed class OptionalConverter<T> : JsonConverter<Optional<T>>
    {
        public override bool HandleNull => true;

        public override Optional<T> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) =>
            new(JsonSerializer.Deserialize<T>(ref reader, options));

        public override void Write(Utf8JsonWriter writer, Optional<T> value, JsonSerializerOptions options)
        {
            if (value.IsPresent) JsonSerializer.Serialize(writer, value.Value, options);
            else writer.WriteNullValue();
        }
    }
}

public static class JsonSetup
{
    public static void Configure(JsonSerializerOptions options)
    {
        options.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.DictionaryKeyPolicy = null;
        options.PropertyNameCaseInsensitive = true;
        options.NumberHandling = JsonNumberHandling.AllowReadingFromString;
        // Texto con tildes tal cual (UTF-8), sin secuencias \uXXXX.
        options.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        options.Converters.Add(new JsonStringEnumConverter(namingPolicy: null, allowIntegerValues: false));
        options.Converters.Add(new LocalDateTimeConverter());
    }

    public static readonly JsonSerializerOptions Options = Create();

    private static JsonSerializerOptions Create()
    {
        var options = new JsonSerializerOptions();
        Configure(options);
        return options;
    }
}
