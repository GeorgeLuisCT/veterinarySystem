using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Modules.Customers.Domain;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Modules.Users.Domain;

namespace VetSaas.Modules.Sales.Domain
{
    public enum BillableServiceType
    {
        CLINICAL_SERVICE_ITEM, GROOMING_SESSION, SURGICAL_REPORT, HOSPITALIZATION_CHARGE,
        LABORATORY_ITEM, MEDICATION_ADMINISTRATION, OTHER_SERVICE
    }

    public enum PaymentMethod { CASH, CREDIT_CARD, DEBIT_CARD, YAPE, PLIN, BANK_TRANSFER, MOBILE_PAYMENT, CHECK, OTHER }

    public enum SaleItemKind { PRODUCT, SERVICE }

    public enum SalesDocumentType { BOLETA, FACTURA, NOTA_VENTA, NONE }

    public enum SaleStatus { DRAFT, COMPLETED, VOIDED }

    public enum CashMovementType { INCOME, EXPENSE }

    public enum CashSessionStatus { OPEN, CLOSED, ARCHIVED }

    public static class SalesLabels
    {
        public static string Label(this PaymentMethod method) => method switch
        {
            PaymentMethod.CASH => "Efectivo",
            PaymentMethod.CREDIT_CARD => "Tarjeta de Crédito",
            PaymentMethod.DEBIT_CARD => "Tarjeta de Débito",
            PaymentMethod.YAPE => "Yape",
            PaymentMethod.PLIN => "Plin",
            PaymentMethod.BANK_TRANSFER => "Transferencia Bancaria",
            PaymentMethod.MOBILE_PAYMENT => "Pago Móvil",
            PaymentMethod.CHECK => "Cheque",
            _ => "Otros",
        };

        public static string Label(this SalesDocumentType type) => type switch
        {
            SalesDocumentType.BOLETA => "Boleta",
            SalesDocumentType.FACTURA => "Factura",
            SalesDocumentType.NOTA_VENTA => "Nota de Venta",
            _ => "Sin Documento",
        };
    }

    [Table("sales")]
    public class Sale
    {
        public long Id { get; set; }
        public long BranchId { get; set; }
        public Branch Branch { get; set; } = null!;
        public long SellerId { get; set; }
        public User Seller { get; set; } = null!;
        public long? CustomerId { get; set; }
        public Customer? Customer { get; set; }
        [MaxLength(20)] public SaleStatus Status { get; set; } = SaleStatus.DRAFT;
        [MaxLength(20)] public SalesDocumentType? DocumentType { get; set; }
        [MaxLength(32)] public string? DocumentNumber { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal Subtotal { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal TaxTotal { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal GrandTotal { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? VoidedAt { get; set; }
        [MaxLength(255)] public string? VoidReason { get; set; }
        public long? SourceAttentionId { get; set; }
        public string? Notes { get; set; }
        public List<SaleDetail> Details { get; set; } = new();
        public List<SalePayment> Payments { get; set; } = new();
    }

    [Table("sale_details")]
    public class SaleDetail
    {
        public long Id { get; set; }
        public long SaleId { get; set; }
        public Sale Sale { get; set; } = null!;
        [MaxLength(255)] public string ItemDescription { get; set; } = null!;
        [Column(TypeName = "numeric(14,2)")] public decimal UnitPrice { get; set; }
        [Column(TypeName = "numeric(14,3)")] public decimal Quantity { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal LineSubtotal { get; set; }
        [Column(TypeName = "numeric(6,4)")] public decimal? TaxRate { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal? TaxAmount { get; set; }
        public long? ProductId { get; set; }
        public Product? Product { get; set; }
        public long? SaleModeId { get; set; }
        public ProductSaleMode? SaleMode { get; set; }
        public long? ProductBatchId { get; set; }
        public ProductBatch? ProductBatch { get; set; }
        [MaxLength(24)] public ProductUnitType? UnitType { get; set; }
        [MaxLength(40)] public BillableServiceType? ServiceType { get; set; }
        public long? ServiceItemId { get; set; }
        public string? MetadataJson { get; set; }
    }

    [Table("sale_payments")]
    public class SalePayment
    {
        public long Id { get; set; }
        public long SaleId { get; set; }
        public Sale Sale { get; set; } = null!;
        [Column(TypeName = "numeric(14,2)")] public decimal AmountPaid { get; set; }
        [MaxLength(32)] public PaymentMethod PaymentMethod { get; set; }
        public DateTime PaidAt { get; set; }
        [MaxLength(100)] public string? PaymentReference { get; set; }
        public string? Notes { get; set; }
        public long CashSessionId { get; set; }
        public CashSession CashSession { get; set; } = null!;
    }

    [Table("cash_sessions")]
    public class CashSession
    {
        public long Id { get; set; }
        public long BranchId { get; set; }
        public Branch Branch { get; set; } = null!;
        /// <summary>Usuario cajero.</summary>
        public long CashierId { get; set; }
        public User Cashier { get; set; } = null!;
        public DateTime OpenedAt { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal OpeningAmount { get; set; }
        public DateTime? ClosedAt { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal? CalculatedClosingAmount { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal? CountedClosingAmount { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal? DifferenceAmount { get; set; }
        public string? ClosingNotes { get; set; }
        [MaxLength(16)] public CashSessionStatus Status { get; set; } = CashSessionStatus.OPEN;
        public List<CashSessionMovement> Movements { get; set; } = new();
    }

    [Table("cash_session_movements")]
    public class CashSessionMovement
    {
        public long Id { get; set; }
        public long CashSessionId { get; set; }
        public CashSession CashSession { get; set; } = null!;
        [MaxLength(16)] public CashMovementType MovementType { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal Amount { get; set; }
        [MaxLength(150)] public string Reason { get; set; } = null!;
        public long RegisteredById { get; set; }
        public User RegisteredBy { get; set; } = null!;
        public DateTime RegisteredAt { get; set; }
        [MaxLength(100)] public string? Reference { get; set; }
    }
}

namespace VetSaas.Shared.Infrastructure.Persistence
{
    using VetSaas.Modules.Sales.Domain;

    public partial class TenantDbContext
    {
        public DbSet<Sale> Sales => Set<Sale>();
        public DbSet<SaleDetail> SaleDetails => Set<SaleDetail>();
        public DbSet<SalePayment> SalePayments => Set<SalePayment>();
        public DbSet<CashSession> CashSessions => Set<CashSession>();
        public DbSet<CashSessionMovement> CashSessionMovements => Set<CashSessionMovement>();
    }
}

namespace VetSaas.Modules.Sales.Infrastructure
{
    using VetSaas.Modules.Sales.Domain;

    public sealed class SaleConfiguration : IEntityTypeConfiguration<Sale>
    {
        public void Configure(EntityTypeBuilder<Sale> builder)
        {
            builder.HasIndex(s => new { s.BranchId, s.Status });
            builder.HasIndex(s => new { s.DocumentType, s.DocumentNumber });
            builder.HasIndex(s => s.CustomerId);
            builder.HasMany(s => s.Details).WithOne(d => d.Sale).HasForeignKey(d => d.SaleId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(s => s.Payments).WithOne(p => p.Sale).HasForeignKey(p => p.SaleId).OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class SaleDetailConfiguration : IEntityTypeConfiguration<SaleDetail>
    {
        public void Configure(EntityTypeBuilder<SaleDetail> builder) => builder.HasIndex(d => new { d.ServiceType, d.ServiceItemId });
    }

    public sealed class CashSessionConfiguration : IEntityTypeConfiguration<CashSession>
    {
        public void Configure(EntityTypeBuilder<CashSession> builder)
        {
            builder.HasIndex(s => new { s.BranchId, s.Status }).HasDatabaseName("idx_cash_session_branch_status");
            builder.HasIndex(s => s.CashierId).HasDatabaseName("idx_cash_session_cashier");
            // Garantía en la base: una sola caja abierta por sucursal, aunque lleguen dos aperturas a la vez.
            builder.HasIndex(s => s.BranchId).IsUnique().HasFilter("status = 'OPEN'").HasDatabaseName("ux_cash_session_one_open_per_branch");
            builder.HasMany(s => s.Movements).WithOne(m => m.CashSession).HasForeignKey(m => m.CashSessionId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
