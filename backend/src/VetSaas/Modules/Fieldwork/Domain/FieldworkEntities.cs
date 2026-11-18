using VetSaas.Modules.Catalogs;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Modules.Customers.Domain;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Modules.Inventory.Domain;

namespace VetSaas.Modules.Fieldwork.Domain
{
    public enum FieldTaskStatus { PENDING, ASSIGNED, IN_PROGRESS, DONE, CANCELED }
    public enum FieldTeamStatus { OFFLINE, ON_ROUTE, IN_VISIT, FINISHED }
    public enum FieldVisitStatus { PLANNED, IN_PROGRESS, COMPLETED, CANCELED }
    public enum StockLocationType { BRANCH_WAREHOUSE, VEHICLE, FIELD }
    public enum StockMovementType { LOAD_TO_VEHICLE, UNLOAD_TO_WAREHOUSE, CONSUMPTION, ADJUSTMENT }

    [Table("geo_zones")]
    public class GeoZone
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        [Catalog(CatalogKeys.GeoZoneType)] [MaxLength(60)] public string Type { get; set; } = "SECTOR";
        public long? ParentId { get; set; }
        public GeoZone? Parent { get; set; }
        public string? GpsCoordinates { get; set; }
        public bool Active { get; set; } = true;
    }

    [Table("farms")]
    public class Farm
    {
        public long Id { get; set; }
        public long CustomerId { get; set; }
        public Customer Customer { get; set; } = null!;
        public string Name { get; set; } = null!;
        public long? ZoneId { get; set; }
        public GeoZone? Zone { get; set; }
        public string? LocationDescription { get; set; }
        public string? GpsCoordinates { get; set; }
        public string? AddressLabel { get; set; }
    }

    [Table("vehicles")]
    public class Vehicle
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string? LicensePlate { get; set; }
        [Column("assigned_vet_employee_id")] public long? AssignedVetId { get; set; }
        public Employee? AssignedVet { get; set; }
        public long? HomeBranchId { get; set; }
        public Branch? HomeBranch { get; set; }
        public bool Active { get; set; } = true;
    }

    [Table("product_vehicle_stock")]
    public class ProductVehicleStock
    {
        public long Id { get; set; }
        public long VehicleId { get; set; }
        public Vehicle Vehicle { get; set; } = null!;
        public long ProductId { get; set; }
        public Product Product { get; set; } = null!;
        [MaxLength(20)] public ProductUnitType Unit { get; set; } = ProductUnitType.UNIT;
        public int Quantity { get; set; }
    }

    [Table("product_stock_movements")]
    public class ProductStockMovement
    {
        public long Id { get; set; }
        public StockMovementType MovementType { get; set; }
        public long ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public int QuantityDelta { get; set; }
        public StockLocationType FromType { get; set; }
        public StockLocationType ToType { get; set; }
        public long? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }
        public long? BranchId { get; set; }
        public Branch? Branch { get; set; }
        public long? FieldVisitId { get; set; }
        public FieldVisit? FieldVisit { get; set; }
        [Column("created_by")] public long? CreatedById { get; set; }
        public Employee? CreatedBy { get; set; }
        [MaxLength(20)] public ProductUnitType? Unit { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Notes { get; set; }
    }

    [Table("vehicle_location_ping")]
    public class VehicleLocationPing
    {
        public long Id { get; set; }
        public long VehicleId { get; set; }
        public Vehicle Vehicle { get; set; } = null!;
        public long? EmployeeId { get; set; }
        public Employee? Employee { get; set; }
        public DateTime Timestamp { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? SpeedKmh { get; set; }
        public string? Note { get; set; }
    }

    [Table("field_visits")]
    public class FieldVisit
    {
        public long Id { get; set; }
        public long? FarmId { get; set; }
        public Farm? Farm { get; set; }
        public long? ZoneId { get; set; }
        public GeoZone? Zone { get; set; }
        [Column("field_vet_employee_id")] public long FieldVetId { get; set; }
        public Employee FieldVet { get; set; } = null!;
        public long? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }
        public DateTime ScheduledDateTime { get; set; }
        public DateTime? StartDateTime { get; set; }
        public DateTime? EndDateTime { get; set; }
        public string? Objective { get; set; }
        public FieldVisitStatus Status { get; set; }
        public int? RouteOrder { get; set; }
        public string? ReportSummary { get; set; }
        public ICollection<FieldVisitServiceItem> ServiceItems { get; set; } = new List<FieldVisitServiceItem>();
        public ICollection<FieldVisitProductUsage> ProductUsages { get; set; } = new List<FieldVisitProductUsage>();
        public ICollection<FieldVisitCompanion> Companions { get; set; } = new List<FieldVisitCompanion>();
        public FieldVisitBiosecurity? Biosecurity { get; set; }
        public FieldVisitReport? Report { get; set; }
        public ICollection<FieldVisitAttachment> Attachments { get; set; } = new List<FieldVisitAttachment>();
    }

    [Table("field_visit_companions")]
    public class FieldVisitCompanion
    {
        public long Id { get; set; }
        public long FieldVisitId { get; set; }
        public FieldVisit FieldVisit { get; set; } = null!;
        public long EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;
    }

    [Table("field_visit_attachments")]
    public class FieldVisitAttachment
    {
        public long Id { get; set; }
        public long FieldVisitId { get; set; }
        public FieldVisit FieldVisit { get; set; } = null!;
        public string FileName { get; set; } = null!;
        [MaxLength(2048)] public string FileUrl { get; set; } = null!;
        public string? MimeType { get; set; }
    }

    [Table("field_visit_biosecurity")]
    public class FieldVisitBiosecurity
    {
        public long Id { get; set; }
        public long FieldVisitId { get; set; }
        public FieldVisit FieldVisit { get; set; } = null!;
        public bool VehicleAndEquipmentCleaned { get; set; }
        public bool PpeUsed { get; set; }
        public bool HandHygiene { get; set; }
        public string? Notes { get; set; }
    }

    [Table("field_visit_report")]
    public class FieldVisitReport
    {
        public long Id { get; set; }
        [Timestamp] public uint Version { get; set; }
        public long FieldVisitId { get; set; }
        public FieldVisit FieldVisit { get; set; } = null!;
        public string? Findings { get; set; }
        public string? Diagnoses { get; set; }
        public string? Recommendations { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    [Table("field_visit_product_usage")]
    public class FieldVisitProductUsage
    {
        public long Id { get; set; }
        public long FieldVisitId { get; set; }
        public FieldVisit FieldVisit { get; set; } = null!;
        public long ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public ProductUnitType Unit { get; set; }
        public int QuantityUsed { get; set; }
        [Column("vehicle_id")] public long? SourceVehicleId { get; set; }
        public Vehicle? SourceVehicle { get; set; }
        public string? Notes { get; set; }
        [Column(TypeName = "numeric(12,2)")] public decimal? UnitPrice { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal? Subtotal { get; set; }
    }

    [Table("field_visit_service_items")]
    public class FieldVisitServiceItem
    {
        public long Id { get; set; }
        public long FieldVisitId { get; set; }
        public FieldVisit FieldVisit { get; set; } = null!;
        public long ClinicalServiceId { get; set; }
        public ClinicalService ClinicalService { get; set; } = null!;
        public int Quantity { get; set; } = 1;
        [Column(TypeName = "numeric(12,2)")] public decimal UnitPrice { get; set; }
        [Column("performed_by")] public long? PerformedById { get; set; }
        public Employee? PerformedBy { get; set; }
        public string? Notes { get; set; }
        public ICollection<FieldVisitServiceAnimal> Animals { get; set; } = new List<FieldVisitServiceAnimal>();
        public ICollection<FieldVisitServiceGroup> Groups { get; set; } = new List<FieldVisitServiceGroup>();
        public ICollection<FieldVisitServiceProduct> Products { get; set; } = new List<FieldVisitServiceProduct>();
    }

    [Table("field_visit_service_animals")]
    public class FieldVisitServiceAnimal
    {
        public long Id { get; set; }
        public long ServiceItemId { get; set; }
        public FieldVisitServiceItem ServiceItem { get; set; } = null!;
        public long AnimalId { get; set; }
        public Animal Animal { get; set; } = null!;
    }

    [Table("field_visit_service_groups")]
    public class FieldVisitServiceGroup
    {
        public long Id { get; set; }
        public long ServiceItemId { get; set; }
        public FieldVisitServiceItem ServiceItem { get; set; } = null!;
        [Catalog(CatalogKeys.AnimalSpecies)] [MaxLength(60)] public string? Species { get; set; }
        public string? Breed { get; set; }
        public int? Quantity { get; set; }
        public string? Description { get; set; }
    }

    [Table("field_visit_service_products")]
    public class FieldVisitServiceProduct
    {
        public long Id { get; set; }
        public long ServiceItemId { get; set; }
        public FieldVisitServiceItem ServiceItem { get; set; } = null!;
        public long ProductId { get; set; }
        public Product Product { get; set; } = null!;
        [Column(TypeName = "numeric(12,3)")] public decimal? Dose { get; set; }
        [MaxLength(32)] public ProductUnitType Unit { get; set; }
        [Catalog(CatalogKeys.AdministrationRoute)] [MaxLength(60)] public string AdministrationRoute { get; set; }
    }

    [Table("field_tasks")]
    public class FieldTask
    {
        public long Id { get; set; }
        public string Title { get; set; } = null!;
        public long FarmId { get; set; }
        public Farm Farm { get; set; } = null!;
        public long? ZoneId { get; set; }
        public GeoZone? Zone { get; set; }
        public string? Description { get; set; }
        [Catalog(CatalogKeys.FieldTaskPriority)] [MaxLength(60)] public string Priority { get; set; }
        public FieldTaskStatus Status { get; set; }
        [Column("assigned_to")] public long? AssignedToId { get; set; }
        public Employee? AssignedTo { get; set; }
        [Column("created_by")] public long? CreatedById { get; set; }
        public Employee? CreatedBy { get; set; }
        public DateTime? DueAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public long? CreatedFieldVisitId { get; set; }
        public FieldVisit? CreatedFieldVisit { get; set; }
    }

    [Table("field_route_day")]
    public class FieldRouteDay
    {
        public long Id { get; set; }
        public long EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;
        public long? VehicleId { get; set; }
        public Vehicle? Vehicle { get; set; }
        public DateOnly RouteDate { get; set; }
        public List<FieldRouteStop> Stops { get; set; } = new();
    }

    [Table("field_route_stop")]
    public class FieldRouteStop
    {
        public long Id { get; set; }
        public long RouteDayId { get; set; }
        public FieldRouteDay RouteDay { get; set; } = null!;
        public long FieldVisitId { get; set; }
        public FieldVisit FieldVisit { get; set; } = null!;
        public int Position { get; set; }
        public TimeOnly? Eta { get; set; }
    }

    [Table("field_team_status")]
    public class FieldTeamStatusEntity
    {
        public long Id { get; set; }
        public long EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;
        public FieldTeamStatus Status { get; set; }
        public long? CurrentVisitId { get; set; }
        public FieldVisit? CurrentVisit { get; set; }
        public string? LocationText { get; set; }
        public string? GpsCoordinates { get; set; }
        public DateTime? LastPingAt { get; set; }
    }
}

namespace VetSaas.Shared.Infrastructure.Persistence
{
    using VetSaas.Modules.Fieldwork.Domain;

    public partial class TenantDbContext
    {
        public DbSet<GeoZone> GeoZones => Set<GeoZone>();
        public DbSet<Farm> Farms => Set<Farm>();
        public DbSet<Vehicle> Vehicles => Set<Vehicle>();
        public DbSet<ProductVehicleStock> ProductVehicleStocks => Set<ProductVehicleStock>();
        public DbSet<ProductStockMovement> ProductStockMovements => Set<ProductStockMovement>();
        public DbSet<VehicleLocationPing> VehicleLocationPings => Set<VehicleLocationPing>();
        public DbSet<FieldVisit> FieldVisits => Set<FieldVisit>();
        public DbSet<FieldVisitCompanion> FieldVisitCompanions => Set<FieldVisitCompanion>();
        public DbSet<FieldVisitAttachment> FieldVisitAttachments => Set<FieldVisitAttachment>();
        public DbSet<FieldVisitBiosecurity> FieldVisitBiosecurities => Set<FieldVisitBiosecurity>();
        public DbSet<FieldVisitReport> FieldVisitReports => Set<FieldVisitReport>();
        public DbSet<FieldVisitProductUsage> FieldVisitProductUsages => Set<FieldVisitProductUsage>();
        public DbSet<FieldVisitServiceItem> FieldVisitServiceItems => Set<FieldVisitServiceItem>();
        public DbSet<FieldTask> FieldTasks => Set<FieldTask>();
        public DbSet<FieldRouteDay> FieldRouteDays => Set<FieldRouteDay>();
        public DbSet<FieldRouteStop> FieldRouteStops => Set<FieldRouteStop>();
        public DbSet<FieldTeamStatusEntity> FieldTeamStatuses => Set<FieldTeamStatusEntity>();
    }
}

namespace VetSaas.Modules.Fieldwork.Infrastructure
{
    using VetSaas.Modules.Fieldwork.Domain;

    public sealed class GeoZoneConfiguration : IEntityTypeConfiguration<GeoZone>
    {
        public void Configure(EntityTypeBuilder<GeoZone> b) => b.HasIndex(z => new { z.Name, z.ParentId }).IsUnique();
    }

    public sealed class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
    {
        public void Configure(EntityTypeBuilder<Vehicle> b)
        {
            b.HasIndex(v => v.Name).IsUnique();
            b.HasIndex(v => v.LicensePlate).IsUnique();
        }
    }

    public sealed class ProductVehicleStockConfiguration : IEntityTypeConfiguration<ProductVehicleStock>
    {
        public void Configure(EntityTypeBuilder<ProductVehicleStock> b) => b.HasIndex(s => new { s.VehicleId, s.ProductId }).IsUnique();
    }

    public sealed class ProductStockMovementConfiguration : IEntityTypeConfiguration<ProductStockMovement>
    {
        public void Configure(EntityTypeBuilder<ProductStockMovement> b)
        {
            b.HasIndex(m => m.CreatedAt);
            b.HasIndex(m => m.MovementType);
        }
    }

    public sealed class VehicleLocationPingConfiguration : IEntityTypeConfiguration<VehicleLocationPing>
    {
        public void Configure(EntityTypeBuilder<VehicleLocationPing> b) => b.HasIndex(p => p.Timestamp);
    }

    public sealed class FieldVisitConfiguration : IEntityTypeConfiguration<FieldVisit>
    {
        public void Configure(EntityTypeBuilder<FieldVisit> b)
        {
            b.HasIndex(v => v.ScheduledDateTime);
            b.HasIndex(v => v.Status);
            b.HasMany(v => v.ServiceItems).WithOne(i => i.FieldVisit).HasForeignKey(i => i.FieldVisitId).OnDelete(DeleteBehavior.Cascade);
            b.HasMany(v => v.ProductUsages).WithOne(u => u.FieldVisit).HasForeignKey(u => u.FieldVisitId).OnDelete(DeleteBehavior.Cascade);
            b.HasMany(v => v.Companions).WithOne(c => c.FieldVisit).HasForeignKey(c => c.FieldVisitId).OnDelete(DeleteBehavior.Cascade);
            b.HasMany(v => v.Attachments).WithOne(a => a.FieldVisit).HasForeignKey(a => a.FieldVisitId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(v => v.Biosecurity).WithOne(x => x.FieldVisit).HasForeignKey<FieldVisitBiosecurity>(x => x.FieldVisitId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(v => v.Report).WithOne(x => x.FieldVisit).HasForeignKey<FieldVisitReport>(x => x.FieldVisitId).OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class FieldVisitCompanionConfiguration : IEntityTypeConfiguration<FieldVisitCompanion>
    {
        public void Configure(EntityTypeBuilder<FieldVisitCompanion> b) => b.HasIndex(c => new { c.FieldVisitId, c.EmployeeId }).IsUnique();
    }

    public sealed class FieldVisitServiceItemConfiguration : IEntityTypeConfiguration<FieldVisitServiceItem>
    {
        public void Configure(EntityTypeBuilder<FieldVisitServiceItem> b)
        {
            b.HasMany(i => i.Animals).WithOne(a => a.ServiceItem).HasForeignKey(a => a.ServiceItemId).OnDelete(DeleteBehavior.Cascade);
            b.HasMany(i => i.Groups).WithOne(g => g.ServiceItem).HasForeignKey(g => g.ServiceItemId).OnDelete(DeleteBehavior.Cascade);
            b.HasMany(i => i.Products).WithOne(p => p.ServiceItem).HasForeignKey(p => p.ServiceItemId).OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class FieldTaskConfiguration : IEntityTypeConfiguration<FieldTask>
    {
        public void Configure(EntityTypeBuilder<FieldTask> b)
        {
            b.HasIndex(t => t.Status);
            b.HasIndex(t => t.Priority);
            b.HasOne(t => t.CreatedFieldVisit).WithMany().HasForeignKey(t => t.CreatedFieldVisitId);
            b.HasIndex(t => t.CreatedFieldVisitId).IsUnique();
        }
    }

    public sealed class FieldRouteDayConfiguration : IEntityTypeConfiguration<FieldRouteDay>
    {
        public void Configure(EntityTypeBuilder<FieldRouteDay> b)
        {
            b.HasIndex(d => new { d.EmployeeId, d.RouteDate }).IsUnique();
            b.HasMany(d => d.Stops).WithOne(s => s.RouteDay).HasForeignKey(s => s.RouteDayId).OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class FieldTeamStatusConfiguration : IEntityTypeConfiguration<FieldTeamStatusEntity>
    {
        public void Configure(EntityTypeBuilder<FieldTeamStatusEntity> b) => b.HasIndex(s => s.EmployeeId).IsUnique();
    }
}
