using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace VetSaas.Modules.Catalogs
{
    /// <summary>
    /// Marca una propiedad cuyo valor sale de un catálogo editable. Al guardar, <c>TenantDbContext</c> comprueba que cada valor
    /// nuevo o cambiado exista y esté activo en ese catálogo (un valor ya guardado sigue siendo válido aunque luego se desactive).
    /// </summary>
    [AttributeUsage(AttributeTargets.Property)]
    public sealed class CatalogAttribute : Attribute
    {
        public CatalogAttribute(string key) => Key = key;
        public string Key { get; }
    }

    public sealed record CatalogSeed(string Code, string Label, string? Abbreviation = null, string? PluralLabel = null);

    /// <summary>Definición de un catálogo: su clave, cómo se presenta y los valores con los que nace en cada empresa.</summary>
    public sealed record CatalogDefinition(
        string Key, string Title, string Description, string Group,
        bool UsesAbbreviation, string? AbbreviationLabel, bool UsesPlural,
        IReadOnlyList<CatalogSeed> Defaults);

    /// <summary>
    /// CATÁLOGOS EDITABLES: listas de negocio que el código no usa para tomar decisiones (solo se guardan y se muestran). Los estados y
    /// tipos de los que dependen reglas siguen como enums en el código. Los valores por defecto son los que existían como enum: los
    /// códigos ya guardados en la base siguen siendo válidos.
    /// </summary>
    public static class CatalogKeys
    {
        public const string AnimalSpecies = "animal_species";
        public const string AdministrationRoute = "administration_route";
        public const string ProductPresentation = "product_presentation";
        public const string SupplierType = "supplier_type";
        public const string MedicalRecordCategory = "medical_record_category";
        public const string CageSize = "cage_size";
        public const string GeoZoneType = "geo_zone_type";
        public const string FieldTaskPriority = "field_task_priority";
        public const string TreasuryAccountType = "treasury_account_type";
        public const string LabUnit = "lab_unit";

        private static CatalogSeed S(string code, string label, string? abbreviation = null, string? plural = null) =>
            new(code, label, abbreviation, plural);

        public static readonly IReadOnlyList<CatalogDefinition> All =
        [
            new(AnimalSpecies, "Especies", "Las especies de los pacientes y de los grupos atendidos en campo.", "Clientes y pacientes",
                false, null, false,
                [S("CANINE", "Perro"), S("FELINE", "Gato"), S("RABBIT", "Conejo"), S("HAMSTER", "Hámster"), S("GUINEA_PIG", "Cobayo / Cuyo"),
                 S("AVIAN", "Ave"), S("REPTILE", "Reptil"), S("EQUINE", "Equino"), S("BOVINE", "Bovino"), S("OVINE", "Ovino"),
                 S("CAPRINE", "Caprino"), S("PORCINE", "Porcino"), S("CAMELID", "Camélido"), S("OTHER", "Otro")]),

            new(AdministrationRoute, "Vías de administración", "Cómo se aplica un medicamento (oral, intramuscular…).", "Clínica",
                true, "Abreviatura", false,
                [S("INTRAMUSCULAR", "Intramuscular", "IM"), S("INTRAVENOSA", "Intravenosa", "IV"), S("SUBCUTANEA", "Subcutánea", "SC"),
                 S("ORAL", "Oral", "PO"), S("TOPICA", "Tópica", "TOP"), S("INHALATORIA", "Inhalatoria", "INH"),
                 S("INTRADERMICA", "Intradérmica", "ID"), S("OFTALMICA", "Oftálmica", "OFT"), S("OTICA", "Ótica", "OTI"),
                 S("NASAL", "Nasal", "NAS"), S("RECTAL", "Rectal", "REC"), S("VAGINAL", "Vaginal", "VAG"),
                 S("SUBLINGUAL", "Sublingual", "SL"), S("BUCAL", "Bucal", "BUC")]),

            new(MedicalRecordCategory, "Categorías de registro médico", "Cómo se clasifican las entradas del expediente.", "Clínica",
                false, null, false,
                [S("CONSULTATION", "Consulta"), S("SURGERY", "Cirugía"), S("GROOMING", "Peluquería"), S("VACCINATION", "Vacunación"),
                 S("LAB", "Laboratorio"), S("NOTE", "Nota clínica"), S("MED_ADMIN", "Administración de medicamento"), S("WEIGHT", "Peso"),
                 S("ATTACHMENT", "Adjunto"), S("STATUS_CHANGE", "Cambio de estado")]),

            new(CageSize, "Tamaños de jaula", "Los tamaños con los que se clasifican las jaulas de hospitalización.", "Clínica",
                false, null, false,
                [S("SMALL", "Pequeña"), S("MEDIUM", "Mediana"), S("LARGE", "Grande")]),

            new(LabUnit, "Unidades de laboratorio", "Unidades de medida de los parámetros de las pruebas de laboratorio.", "Clínica",
                true, "Símbolo", false,
                [S("NONE", "Sin unidad", ""), S("PERCENT", "Porcentaje", "%"), S("G_PER_DL", "Gramo por decilitro", "g/dL"),
                 S("MG_PER_DL", "Miligramo por decilitro", "mg/dL"), S("UG_PER_DL", "Microgramo por decilitro", "µg/dL"),
                 S("NG_PER_ML", "Nanogramo por mililitro", "ng/mL"), S("MMOL_PER_L", "Milimol por litro", "mmol/L"),
                 S("MOL_PER_L", "Mol por litro", "mol/L"), S("U_PER_L", "Unidades por litro", "U/L"),
                 S("IU_PER_L", "Unidades internacionales por litro", "IU/L"), S("K_U_PER_L", "Kilo-unidades por litro", "kU/L"),
                 S("X10_3_PER_UL", "×10³ por microlitro", "x10^3/µL"), S("X10_6_PER_UL", "×10⁶ por microlitro", "x10^6/µL"),
                 S("CELLS_PER_UL", "Células por microlitro", "cél/µL"), S("PLATELETS_PER_UL", "Plaquetas por microlitro", "plt/µL"),
                 S("FL", "Femtolitro", "fL"), S("PG", "Picogramo", "pg"), S("G_PER_L", "Gramo por litro", "g/L"),
                 S("MG_PER_L", "Miligramo por litro", "mg/L"), S("UMOL_PER_L", "Micromol por litro", "µmol/L"),
                 S("MS", "Milisegundo", "ms"), S("SEC", "Segundo", "s"), S("MIN", "Minuto", "min")]),

            new(ProductPresentation, "Presentaciones de producto", "En qué viene un producto (caja, frasco, ampolla…).", "Inventario",
                false, null, true,
                [S("BOTTLE", "Botella", plural: "Botellas"), S("BAG", "Bolsa", plural: "Bolsas"), S("BOX", "Caja", plural: "Cajas"),
                 S("JAR", "Frasco", plural: "Frascos"), S("SACHET", "Sobre", plural: "Sobres"), S("BLISTER", "Blíster", plural: "Blísters"),
                 S("CAN", "Lata", plural: "Latas"), S("TUBE", "Tubo", plural: "Tubos"), S("PACK", "Paquete", plural: "Paquetes"),
                 S("AMPOULE", "Ampolla", plural: "Ampollas"), S("SYRINGE", "Jeringa precargada", plural: "Jeringas precargadas"),
                 S("GALLON", "Galón", plural: "Galones"), S("CASE", "Estuche", plural: "Estuches"), S("ROLL", "Rollo", plural: "Rollos"),
                 S("UNIT", "Unidad", plural: "Unidades")]),

            new(SupplierType, "Tipos de proveedor", "Cómo se clasifica a un proveedor.", "Inventario",
                false, null, false,
                [S("NATURAL", "Persona Natural"), S("JURIDICAL", "Persona Jurídica"), S("COMPANY", "Empresa")]),

            new(GeoZoneType, "Tipos de zona", "Niveles de las zonas geográficas (región, provincia, sector…).", "Veterinaria de campo",
                false, null, false,
                [S("COUNTRY", "País"), S("REGION", "Región"), S("PROVINCE", "Provincia"), S("DISTRICT", "Distrito"),
                 S("SECTOR", "Sector"), S("CUSTOM", "Personalizado")]),

            new(FieldTaskPriority, "Prioridades de tarea", "Las prioridades de las tareas de campo, de menor a mayor.", "Veterinaria de campo",
                false, null, false,
                [S("LOW", "Baja"), S("MEDIUM", "Media"), S("HIGH", "Alta"), S("URGENT", "Urgente")]),

            new(TreasuryAccountType, "Tipos de cuenta", "Cómo se clasifican las cuentas de tesorería.", "Finanzas",
                false, null, false,
                [S("BANK", "Banco"), S("CASH", "Efectivo"), S("DIGITAL", "Digital")]),
        ];

        public static readonly IReadOnlyDictionary<string, CatalogDefinition> ByKey = All.ToDictionary(d => d.Key);
    }

    /// <summary>Un valor de un catálogo. El código no cambia nunca (es lo que se guarda en los datos); el texto sí.</summary>
    [Table("catalog_items")]
    public class CatalogItem
    {
        public long Id { get; set; }
        [MaxLength(60)] public string Catalog { get; set; } = null!;
        [MaxLength(60)] public string Code { get; set; } = null!;
        [MaxLength(120)] public string Label { get; set; } = null!;
        [MaxLength(120)] public string? PluralLabel { get; set; }
        [MaxLength(30)] public string? Abbreviation { get; set; }
        public int SortOrder { get; set; }
        public bool Active { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public sealed class CatalogItemConfiguration : IEntityTypeConfiguration<CatalogItem>
    {
        public void Configure(EntityTypeBuilder<CatalogItem> b) => b.HasIndex(i => new { i.Catalog, i.Code }).IsUnique();
    }
}

namespace VetSaas.Shared.Infrastructure.Persistence
{
    using VetSaas.Modules.Catalogs;

    public partial class TenantDbContext
    {
        public DbSet<CatalogItem> CatalogItems => Set<CatalogItem>();
    }
}
