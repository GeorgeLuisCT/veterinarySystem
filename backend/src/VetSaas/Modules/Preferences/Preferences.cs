using System.Globalization;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace VetSaas.Modules.Preferences
{
    public enum PrefType
    {
        /// <summary>«true» / «false».</summary>
        Bool,
        /// <summary>Número entero (con <c>Min</c>/<c>Max</c>).</summary>
        Int,
        /// <summary>Una opción de una lista.</summary>
        Choice,
        /// <summary>Varias opciones de una lista (el orden no importa).</summary>
        MultiChoice,
    }

    /// <summary>Quién decide el valor. <c>Branch</c> hereda de la empresa si la sucursal no lo cambió.</summary>
    public enum PrefScope { User, Branch, Company }

    /// <summary>De quién es un valor guardado. La empresa es el schema entero, así que su dueño es siempre 0.</summary>
    public enum PreferenceOwner { User, Branch, Company }

    public sealed record PrefOption(string Value, string Label);

    public sealed record PrefGroup(string Key, string Label, string Description, int Order);

    /// <summary>
    /// DECLARACIÓN de una preferencia: es lo único que hay que escribir para tener una nueva. Se declara como campo estático en
    /// <see cref="Prefs"/>; <see cref="PreferenceRegistry"/> las descubre solo y la API no arranca si hay claves repetidas, valores por
    /// defecto inválidos o grupos inexistentes. La pantalla de Preferencias se dibuja a partir de esto, sin tocar el frontend.
    /// El valor viaja siempre como texto: «true», «12», «dmy», «a,b,c».
    /// </summary>
    public sealed record PreferenceDef
    {
        public required string Key { get; init; }
        public required string Group { get; init; }
        public required string Label { get; init; }
        public required string Description { get; init; }
        public required PrefType Type { get; init; }
        public required PrefScope Scope { get; init; }
        public required string Default { get; init; }
        public int Min { get; init; }
        public int Max { get; init; } = int.MaxValue;
        /// <summary>Unidad del número («min», «%»).</summary>
        public string? Unit { get; init; }
        public IReadOnlyList<PrefOption> Options { get; init; } = [];
        /// <summary>Texto de ayuda bajo el control, p. ej. «0 = sin límite».</summary>
        public string? Hint { get; init; }

        public static PreferenceDef Bool(string key, string group, PrefScope scope, string label, string description, bool @default) =>
            new() { Key = key, Group = group, Scope = scope, Label = label, Description = description, Type = PrefType.Bool, Default = Fmt(@default) };

        public static PreferenceDef Int(string key, string group, PrefScope scope, string label, string description, int @default, int min, int max,
            string? unit = null, string? hint = null) =>
            new()
            {
                Key = key, Group = group, Scope = scope, Label = label, Description = description, Type = PrefType.Int,
                Default = @default.ToString(CultureInfo.InvariantCulture), Min = min, Max = max, Unit = unit, Hint = hint,
            };

        public static PreferenceDef Choice(string key, string group, PrefScope scope, string label, string description, string @default,
            params PrefOption[] options) =>
            new() { Key = key, Group = group, Scope = scope, Label = label, Description = description, Type = PrefType.Choice, Default = @default, Options = options };

        public static PreferenceDef Multi(string key, string group, PrefScope scope, string label, string description, IEnumerable<string> @default,
            params PrefOption[] options) =>
            new()
            {
                Key = key, Group = group, Scope = scope, Label = label, Description = description, Type = PrefType.MultiChoice,
                Default = string.Join(',', @default), Options = options,
            };

        public static string Fmt(bool v) => v ? "true" : "false";

        /// <summary>
        /// Lectura de un valor guardado: en selección múltiple ignora las opciones que dejaron de existir y conserva el resto. Un valor
        /// vacío se respeta («ninguno»); si lo guardado no era vacío y no queda ninguna opción vigente, lanza y se hereda.
        /// </summary>
        public string NormalizeLenient(string? raw)
        {
            if (Type != PrefType.MultiChoice) return Normalize(raw);
            if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
            string kept = string.Join(',', raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(i => Options.Any(o => o.Value == i)));
            if (kept.Length == 0) throw new ArgumentException($"«{Label}»: no queda ninguna opción vigente.");
            return Normalize(kept);
        }

        /// <summary>Normaliza y valida un valor que llega de afuera; lanza <see cref="ArgumentException"/> con un mensaje claro.</summary>
        public string Normalize(string? raw)
        {
            string v = (raw ?? string.Empty).Trim();
            switch (Type)
            {
                case PrefType.Bool:
                    if (!bool.TryParse(v, out bool b)) throw new ArgumentException($"«{Label}»: debe ser sí o no.");
                    return Fmt(b);
                case PrefType.Int:
                    if (!int.TryParse(v, NumberStyles.Integer, CultureInfo.InvariantCulture, out int n))
                        throw new ArgumentException($"«{Label}»: debe ser un número entero.");
                    if (n < Min || n > Max) throw new ArgumentException($"«{Label}»: debe estar entre {Min} y {Max}{(Unit is null ? "" : " " + Unit)}.");
                    return n.ToString(CultureInfo.InvariantCulture);
                case PrefType.Choice:
                    if (Options.All(o => o.Value != v)) throw new ArgumentException($"«{Label}»: opción no válida.");
                    return v;
                default:
                    List<string> items = [.. v.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Distinct()];
                    string? bad = items.FirstOrDefault(i => Options.All(o => o.Value != i));
                    if (bad is not null) throw new ArgumentException($"«{Label}»: opción no válida ({bad}).");
                    return string.Join(',', Options.Select(o => o.Value).Where(items.Contains)); // orden estable
            }
        }
    }

    /// <summary>
    /// GRUPOS de la pantalla de Preferencias. Para agregar una preferencia: declararla en <see cref="Prefs"/> (en un grupo de aquí) y leerla
    /// donde cambia el comportamiento (<c>await prefs.IntAsync(Prefs.X)</c> en el backend, <c>usePref(PREF.x)</c> en el frontend).
    /// Los valores por defecto son SIEMPRE el comportamiento previo: nada cambia hasta que alguien toque la preferencia.
    /// </summary>
    public static class PrefGroups
    {
        public static readonly PrefGroup Appearance = new("appearance", "Apariencia", "Cómo se ve la aplicación para ti.", 10);
        public static readonly PrefGroup Start = new("start", "Inicio", "Qué ves primero al entrar.", 20);
        public static readonly PrefGroup Schedule = new("schedule", "Agenda", "Valores sugeridos al agendar citas.", 30);
        public static readonly PrefGroup Interface = new("interface", "Menú", "Qué módulos se muestran en el menú.", 40);
        public static readonly PrefGroup Security = new("security", "Seguridad", "Protección de las sesiones.", 50);
        public static readonly PrefGroup Portal = new("portal", "Portal público", "Límites de las consultas sin iniciar sesión.", 60);
    }

    /// <summary>CATÁLOGO DE PREFERENCIAS de la veterinaria (ver docs/preferencias.md).</summary>
    public static class Prefs
    {
        private static PrefOption O(string value, string label) => new(value, label);

        // ── Mías ─────────────────────────────────────────────────────────────
        public static readonly PreferenceDef FontSize = PreferenceDef.Choice("ui.fontSize", "appearance", PrefScope.User, "Tamaño de letra",
            "Agranda o reduce todo el texto de la aplicación.", "normal", O("normal", "Normal"), O("large", "Grande"), O("xlarge", "Muy grande"));

        public static readonly PreferenceDef Density = PreferenceDef.Choice("ui.density", "appearance", PrefScope.User, "Densidad de las tablas",
            "«Compacta» deja más filas a la vista; «cómoda» da más aire.", "comfortable", O("comfortable", "Cómoda"), O("compact", "Compacta"));

        public static readonly PreferenceDef HomePage = PreferenceDef.Choice("start.home", "start", PrefScope.User, "Pantalla de inicio",
            "A qué pantalla entras al iniciar sesión.", "auto",
            O("auto", "Nueva venta (como hasta ahora)"), O("/dashboard", "Inicio con accesos rápidos"),
            O("/dashboard/schedule/calendar", "Agenda — Calendario"), O("/dashboard/schedule/attentions", "Agenda — Recepción"),
            O("/dashboard/clinical/consultory", "Consultorio"), O("/dashboard/clinical/hospitalization", "Hospitalización"),
            O("/dashboard/grooming", "Peluquería"), O("/dashboard/cashbox/current", "Caja — Corte actual"),
            O("/dashboard/inventory/products", "Inventario — Productos"), O("/dashboard/fieldwork/visits", "Veterinaria de campo — Visitas"),
            O("/dashboard/reports", "Reportes"));

        // ── De la sucursal ───────────────────────────────────────────────────
        public static readonly PreferenceDef AppointmentDuration = PreferenceDef.Int("schedule.defaultDurationMinutes", "schedule", PrefScope.Branch,
            "Duración sugerida de una cita", "Se completa sola al crear una cita; se puede cambiar en cada una.", 0, 0, 480, "min",
            "0 = no sugerir");

        public static readonly PreferenceDef AssumedAppointmentDuration = PreferenceDef.Int("schedule.assumedDurationMinutes", "schedule",
            PrefScope.Branch, "Duración asumida de una cita",
            "Si una cita no indica cuánto dura, se considera que ocupa este tiempo al revisar choques de horario.", 30, 5, 480, "min");

        public static readonly PreferenceDef PastTolerance = PreferenceDef.Int("schedule.pastToleranceMinutes", "schedule", PrefScope.Branch,
            "Margen para agendar en el pasado", "Permite registrar una cita que empezó hace poco (por ejemplo, un paciente que ya llegó).",
            30, 0, 1440, "min");

        public static readonly PreferenceDef HiddenModules = PreferenceDef.Multi("interface.hiddenModules", "interface", PrefScope.Branch,
            "Módulos ocultos", "Se quitan del menú de esta sucursal (solo los oculta; los permisos no cambian).", [],
            O("schedule", "Agenda"), O("crm", "Clientes y pacientes"), O("clinical", "Módulo clínico"), O("pos", "Punto de venta"),
            O("cashbox", "Caja"), O("inventory", "Inventario"), O("fieldwork", "Veterinaria de campo"), O("grooming", "Peluquería"),
            O("reports", "Reportes"), O("finance", "Finanzas"));

        // ── De la empresa ────────────────────────────────────────────────────
        public static readonly PreferenceDef IdleTimeout = PreferenceDef.Int("security.idleTimeoutMinutes", "security", PrefScope.Company,
            "Cerrar sesión por inactividad", "Si nadie usa la aplicación durante ese tiempo, se cierra la sesión.", 0, 0, 480, "min",
            "0 = nunca");
    }

    /// <summary>Preferencias de empresa que se leen sin sesión (portal público).</summary>
    public static class PortalPrefs
    {
        public static readonly PreferenceDef MaxAttempts = PreferenceDef.Int("portal.maxAttempts", "portal", PrefScope.Company,
            "Intentos de consulta permitidos", "Cuántas consultas puede hacer una misma persona o documento antes de tener que esperar.",
            10, 1, 100, "intentos");

        public static readonly PreferenceDef WindowMinutes = PreferenceDef.Int("portal.windowMinutes", "portal", PrefScope.Company,
            "Ventana de intentos", "El tiempo en que se cuentan esos intentos; pasado ese tiempo se vuelve a empezar.", 10, 1, 120, "min");
    }

    /// <summary>
    /// Descubre por reflexión todas las preferencias y grupos del ensamblado y los valida al arrancar: una declaración inconsistente
    /// impide que la API arranque.
    /// </summary>
    public sealed class PreferenceRegistry
    {
        public IReadOnlyList<PreferenceDef> All { get; }
        public IReadOnlyDictionary<string, PreferenceDef> ByKey { get; }
        public IReadOnlyDictionary<string, PrefGroup> Groups { get; }

        public PreferenceRegistry()
        {
            List<PreferenceDef> defs = [];
            List<PrefGroup> groups = [];
            foreach (Type t in typeof(PreferenceRegistry).Assembly.GetTypes().Where(t => t.IsAbstract && t.IsSealed))
                foreach (FieldInfo f in t.GetFields(BindingFlags.Public | BindingFlags.Static)
                             .Where(f => f.FieldType == typeof(PreferenceDef) || f.FieldType == typeof(PrefGroup)))
                {
                    if (f.GetValue(null) is PreferenceDef d) defs.Add(d);
                    else if (f.GetValue(null) is PrefGroup g) groups.Add(g);
                }

            List<string> errors = [];
            foreach (var dup in defs.GroupBy(d => d.Key).Where(g => g.Count() > 1)) errors.Add($"Preferencia repetida: {dup.Key}");
            foreach (var dup in groups.GroupBy(g => g.Key).Where(g => g.Count() > 1)) errors.Add($"Grupo de preferencias repetido: {dup.Key}");
            Dictionary<string, PrefGroup> byGroup = groups.GroupBy(g => g.Key).ToDictionary(g => g.Key, g => g.First());
            foreach (PreferenceDef d in defs)
            {
                if (!byGroup.ContainsKey(d.Group)) errors.Add($"{d.Key}: el grupo «{d.Group}» no existe.");
                if (d.Type is PrefType.Choice or PrefType.MultiChoice && d.Options.Count == 0) errors.Add($"{d.Key}: no tiene opciones.");
                try
                {
                    if (d.Type != PrefType.MultiChoice || d.Default.Length > 0) d.Normalize(d.Default);
                }
                catch (ArgumentException ex)
                {
                    errors.Add($"{d.Key}: el valor por defecto no es válido ({ex.Message}).");
                }
            }
            if (errors.Count > 0) throw new InvalidOperationException("Preferencias mal declaradas:\n - " + string.Join("\n - ", errors));

            All = [.. defs];
            ByKey = defs.ToDictionary(d => d.Key);
            Groups = byGroup;
        }
    }

    /// <summary>
    /// Un valor que alguien cambió. Lo que NO está aquí vale el predeterminado de su <see cref="PreferenceDef"/>: agregar una preferencia
    /// nueva no requiere migración ni datos. Vive en el schema de la empresa, así que no lleva columna de empresa.
    /// </summary>
    [System.ComponentModel.DataAnnotations.Schema.Table("preference_values")]
    public class PreferenceValue
    {
        public long Id { get; set; }
        [System.ComponentModel.DataAnnotations.MaxLength(10)] public PreferenceOwner Owner { get; set; }
        /// <summary>Id del usuario o de la sucursal según <see cref="Owner"/>; 0 para la empresa.</summary>
        public long OwnerId { get; set; }
        [System.ComponentModel.DataAnnotations.MaxLength(100)] public string Key { get; set; } = string.Empty;
        [System.ComponentModel.DataAnnotations.MaxLength(2000)] public string Value { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
        public long? UpdatedBy { get; set; }
    }

    public sealed class PreferenceValueConfiguration : IEntityTypeConfiguration<PreferenceValue>
    {
        public void Configure(EntityTypeBuilder<PreferenceValue> b) => b.HasIndex(v => new { v.Owner, v.OwnerId, v.Key }).IsUnique();
    }
}

namespace VetSaas.Shared.Infrastructure.Persistence
{
    using VetSaas.Modules.Preferences;

    public partial class TenantDbContext
    {
        public DbSet<PreferenceValue> PreferenceValues => Set<PreferenceValue>();
    }
}
