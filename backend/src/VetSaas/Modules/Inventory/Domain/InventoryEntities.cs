using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Modules.Employees.Domain;

namespace VetSaas.Modules.Inventory.Domain
{
    public enum AdjustmentType { ENTRY, EXIT }

    public enum AdministrationRoute
    {
        INTRAMUSCULAR, INTRAVENOSA, SUBCUTANEA, ORAL, TOPICA, INHALATORIA, INTRADERMICA,
        OFTALMICA, OTICA, NASAL, RECTAL, VAGINAL, SUBLINGUAL, BUCAL
    }

    public enum InventoryMovementType { PURCHASE, TRANSFER, ADJUSTMENT, SALE, SERVICE }

    public enum KardexMovementType
    {
        PURCHASE_ENTRY, SALE_EXIT, SERVICE_EXIT, SERVICE_RETURN_ENTRY,
        ADJUSTMENT_ENTRY, ADJUSTMENT_EXIT, TRANSFER_ENTRY, TRANSFER_EXIT
    }

    public enum ProductPresentationType
    {
        BOTTLE, BAG, BOX, JAR, SACHET, BLISTER, CAN, TUBE, PACK, AMPOULE, SYRINGE, GALLON, CASE, ROLL, UNIT
    }

    public enum ProductUnitType
    {
        KILOGRAM, GRAM, MILLIGRAM, MICROGRAM, LITER, MILLILITER, UNIT, CAPSULE, TABLET, PACK, BOX
    }

    public enum SupplierType { NATURAL, JURIDICAL, COMPANY }

    public static class InventoryEnumExtensions
    {
        public static bool IsExit(this KardexMovementType type) => type is KardexMovementType.SALE_EXIT
            or KardexMovementType.SERVICE_EXIT or KardexMovementType.ADJUSTMENT_EXIT or KardexMovementType.TRANSFER_EXIT;

        /// <summary>Unidades físicas que admiten fracciones y conversión (peso y volumen).</summary>
        public static bool IsFractionable(this ProductUnitType unit) => unit is ProductUnitType.KILOGRAM
            or ProductUnitType.GRAM or ProductUnitType.MILLIGRAM or ProductUnitType.MICROGRAM
            or ProductUnitType.LITER or ProductUnitType.MILLILITER;

        public static string Label(this ProductUnitType unit) => unit switch
        {
            ProductUnitType.KILOGRAM => "Kilogramo", ProductUnitType.GRAM => "Gramo",
            ProductUnitType.MILLIGRAM => "Miligramo", ProductUnitType.MICROGRAM => "Microgramo",
            ProductUnitType.LITER => "Litro", ProductUnitType.MILLILITER => "Mililitro",
            ProductUnitType.UNIT => "Unidad", ProductUnitType.CAPSULE => "Cápsula",
            ProductUnitType.TABLET => "Tableta", ProductUnitType.PACK => "Paquete", ProductUnitType.BOX => "Caja",
            _ => unit.ToString()
        };
    }

    [Table("category_product")]
    public class CategoryProduct
    {
        public long Id { get; set; }
        [MaxLength(50)] public string Name { get; set; } = null!;
        public bool IsActive { get; set; } = true;
    }

    [Table("suppliers")]
    public class Supplier
    {
        public long Id { get; set; }
        [MaxLength(250)] public string Name { get; set; } = null!;
        public string? Ruc { get; set; }
        public string? Address { get; set; }
        public string? Website { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public SupplierType SupplierType { get; set; }
        [MaxLength(50)] public string? BankName { get; set; }
        [MaxLength(30)] public string? BankAccountNumber { get; set; }
        public bool Active { get; set; } = true;
    }

    [Table("products")]
    public class Product
    {
        public long Id { get; set; }
        [MaxLength(100)] public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public int MinStock { get; set; }
        public long CategoryId { get; set; }
        public CategoryProduct Category { get; set; } = null!;
        [MaxLength(50)] public string Sku { get; set; } = null!;
        public ProductPresentationType Presentation { get; set; }
        /// <summary>Unidad base: en ella se lleva todo el stock (kardex).</summary>
        public ProductUnitType UnitType { get; set; }
        /// <summary>Cuántas unidades base trae la unidad principal de venta.</summary>
        public double ContentTotal { get; set; }
        public ICollection<ProductAdministrationRoute> AdministrationRoutes { get; set; } = new List<ProductAdministrationRoute>();
        public ICollection<ProductSaleMode> SaleModes { get; set; } = new List<ProductSaleMode>();
        public ICollection<ProductBranch> BranchStocks { get; set; } = new List<ProductBranch>();

        [NotMapped]
        public IEnumerable<AdministrationRoute> Routes => AdministrationRoutes.Select(r => r.Route);
    }

    [Table("product_administration_routes")]
    public class ProductAdministrationRoute
    {
        public long ProductId { get; set; }
        public AdministrationRoute Route { get; set; }
    }

    /// <summary>Habilitación del producto en una sucursal (no guarda stock: el stock es la suma del kardex).</summary>
    [Table("product_branch")]
    public class ProductBranch
    {
        public long Id { get; set; }
        public long BranchId { get; set; }
        public Branch Branch { get; set; } = null!;
        public long ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public bool IsActive { get; set; }
    }

    [Table("product_sale_mode")]
    public class ProductSaleMode
    {
        public long Id { get; set; }
        public long ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public ProductUnitType UnitType { get; set; }
        /// <summary>Equivalencia en unidades base.</summary>
        public double QuantityEquivalent { get; set; }
        public decimal Price { get; set; }
        /// <summary>Modo de venta principal (solo uno por producto).</summary>
        public bool IsBaseMode { get; set; }
    }

    [Table("product_batch")]
    public class ProductBatch
    {
        public long Id { get; set; }
        public long ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public string BatchNumber { get; set; } = null!;
        public DateOnly? ExpirationDate { get; set; }
    }

    [Table("inventory_movement")]
    public class InventoryMovement
    {
        public long Id { get; set; }
        public InventoryMovementType Type { get; set; }
        [Column("branch_id")] public long SourceBranchId { get; set; }
        public Branch SourceBranch { get; set; } = null!;
        public long? TargetBranchId { get; set; }
        public Branch? TargetBranch { get; set; }
        public long? SupplierId { get; set; }
        public Supplier? Supplier { get; set; }
        public long EmployeeId { get; set; }
        public Employee Employee { get; set; } = null!;
        public DateTime Date { get; set; }
        public string? Description { get; set; }
        public List<InventoryMovementProduct> Products { get; set; } = new();
    }

    [Table("inventory_movement_product")]
    public class InventoryMovementProduct
    {
        public long Id { get; set; }
        public long MovementId { get; set; }
        public InventoryMovement Movement { get; set; } = null!;
        public long ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public ProductUnitType UnitType { get; set; }
        public double Quantity { get; set; }
        public decimal? UnitCost { get; set; }
        public long? ProductBatchId { get; set; }
        public ProductBatch? ProductBatch { get; set; }
    }

    /// <summary>Movimiento del kardex en unidad base: entradas positivas, salidas negativas. El stock es su suma.</summary>
    [Table("kardex_movement")]
    public class KardexMovement
    {
        public long Id { get; set; }
        public long ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public long BranchId { get; set; }
        public Branch Branch { get; set; } = null!;
        public long BatchId { get; set; }
        public ProductBatch Batch { get; set; } = null!;
        public DateTime Date { get; set; }
        [MaxLength(30)] public KardexMovementType Type { get; set; }
        public decimal Quantity { get; set; }
        public decimal ResultingStock { get; set; }
        public long OriginId { get; set; }
        [MaxLength(50)] public string OriginType { get; set; } = null!;
    }
}

namespace VetSaas.Shared.Infrastructure.Persistence
{
    using VetSaas.Modules.Inventory.Domain;

    public partial class TenantDbContext
    {
        public DbSet<CategoryProduct> CategoryProducts => Set<CategoryProduct>();
        public DbSet<Supplier> Suppliers => Set<Supplier>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<ProductBranch> ProductBranches => Set<ProductBranch>();
        public DbSet<ProductSaleMode> ProductSaleModes => Set<ProductSaleMode>();
        public DbSet<ProductBatch> ProductBatches => Set<ProductBatch>();
        public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
        public DbSet<KardexMovement> KardexMovements => Set<KardexMovement>();
    }
}

namespace VetSaas.Modules.Inventory.Infrastructure
{
    using VetSaas.Modules.Inventory.Domain;

    public sealed class CategoryProductConfiguration : IEntityTypeConfiguration<CategoryProduct>
    {
        public void Configure(EntityTypeBuilder<CategoryProduct> builder) => builder.HasIndex(c => c.Name).IsUnique();
    }

    public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
    {
        public void Configure(EntityTypeBuilder<Product> builder)
        {
            builder.HasIndex(p => p.Sku).IsUnique();
            builder.Property(p => p.Presentation).HasMaxLength(20);
            builder.Property(p => p.UnitType).HasMaxLength(20);
            builder.HasMany(p => p.AdministrationRoutes).WithOne().HasForeignKey(r => r.ProductId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(p => p.SaleModes).WithOne(m => m.Product).HasForeignKey(m => m.ProductId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(p => p.BranchStocks).WithOne(b => b.Product).HasForeignKey(b => b.ProductId).OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class ProductAdministrationRouteConfiguration : IEntityTypeConfiguration<ProductAdministrationRoute>
    {
        public void Configure(EntityTypeBuilder<ProductAdministrationRoute> builder)
        {
            builder.HasKey(r => new { r.ProductId, r.Route });
            builder.Property(r => r.Route).HasMaxLength(20);
        }
    }

    public sealed class ProductBranchConfiguration : IEntityTypeConfiguration<ProductBranch>
    {
        public void Configure(EntityTypeBuilder<ProductBranch> builder) =>
            builder.HasIndex(p => new { p.ProductId, p.BranchId }).IsUnique();
    }

    public sealed class ProductSaleModeConfiguration : IEntityTypeConfiguration<ProductSaleMode>
    {
        public void Configure(EntityTypeBuilder<ProductSaleMode> builder)
        {
            builder.Property(m => m.UnitType).HasMaxLength(20);
            // Un solo modo de venta principal por producto.
            builder.HasIndex(m => new { m.ProductId, m.UnitType }).IsUnique()
                .HasFilter("is_base_mode IS TRUE").HasDatabaseName("uk_product_base_mode");
        }
    }

    public sealed class ProductBatchConfiguration : IEntityTypeConfiguration<ProductBatch>
    {
        public void Configure(EntityTypeBuilder<ProductBatch> builder) =>
            builder.HasIndex(b => new { b.ProductId, b.BatchNumber }).IsUnique();
    }

    public sealed class InventoryMovementConfiguration : IEntityTypeConfiguration<InventoryMovement>
    {
        public void Configure(EntityTypeBuilder<InventoryMovement> builder)
        {
            builder.HasOne(m => m.SourceBranch).WithMany().HasForeignKey(m => m.SourceBranchId);
            builder.HasOne(m => m.TargetBranch).WithMany().HasForeignKey(m => m.TargetBranchId);
            builder.HasMany(m => m.Products).WithOne(p => p.Movement).HasForeignKey(p => p.MovementId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasIndex(m => m.Date);
        }
    }

    public sealed class KardexMovementConfiguration : IEntityTypeConfiguration<KardexMovement>
    {
        public void Configure(EntityTypeBuilder<KardexMovement> builder)
        {
            builder.Property(k => k.Quantity).HasPrecision(18, 4);
            builder.Property(k => k.ResultingStock).HasPrecision(18, 4);
            builder.HasIndex(k => new { k.ProductId, k.BranchId, k.BatchId });
            builder.HasIndex(k => new { k.OriginType, k.OriginId });
        }
    }
}
