namespace VetSaas.Shared.Infrastructure.Time;

/// <summary>
/// Reloj de la aplicación. Las fechas se guardan como hora «de pared» de la clínica (sin zona),
/// así que «ahora» y «hoy» se calculan en la zona configurada (App:TimeZone), nunca en UTC ni en la del servidor.
/// </summary>
public interface IClock
{
    /// <summary>Fecha y hora actual en la zona de la clínica (Kind = Unspecified).</summary>
    DateTime Now { get; }
    DateOnly Today { get; }
    DateTime UtcNow { get; }
}

public sealed class SystemClock : IClock
{
    private readonly TimeZoneInfo _zone;

    public SystemClock(IConfiguration configuration)
    {
        string zoneId = configuration["App:TimeZone"] ?? "America/Lima";
        _zone = TimeZoneInfo.FindSystemTimeZoneById(zoneId);
    }

    public DateTime UtcNow => DateTime.UtcNow;

    public DateTime Now => DateTime.SpecifyKind(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _zone), DateTimeKind.Unspecified);

    public DateOnly Today => DateOnly.FromDateTime(Now);
}
