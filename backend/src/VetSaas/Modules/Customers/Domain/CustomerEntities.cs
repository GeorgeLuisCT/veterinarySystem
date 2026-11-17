using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace VetSaas.Modules.Customers.Domain
{
    [Table("document_type")]
    public class DocumentType
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Abbreviation { get; set; }
    }

    [Table("customer")]
    public class Customer
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public bool IsActive { get; set; } = true;
        public long DocumentTypeId { get; set; }
        public DocumentType DocumentType { get; set; } = null!;
        public string DocumentNumber { get; set; } = null!;
    }

    public enum AnimalSex { MALE, FEMALE, CASTRATED_MALE, SPAYED_FEMALE }

    public enum AnimalSpecies
    {
        /// <summary>Perro</summary>
        CANINE,
        /// <summary>Gato</summary>
        FELINE,
        RABBIT,
        HAMSTER,
        /// <summary>Cobayo / cuy</summary>
        GUINEA_PIG,
        /// <summary>Ave</summary>
        AVIAN,
        REPTILE,
        /// <summary>Caballo, burro, mula</summary>
        EQUINE,
        /// <summary>Vaca, toro, buey</summary>
        BOVINE,
        /// <summary>Oveja</summary>
        OVINE,
        /// <summary>Cabra</summary>
        CAPRINE,
        /// <summary>Cerdo</summary>
        PORCINE,
        /// <summary>Llama, alpaca</summary>
        CAMELID,
        OTHER
    }

    [Table("animal")]
    public class Animal
    {
        public long Id { get; set; }
        /// <summary>Dueño del animal.</summary>
        [Column("customer_id")] public long OwnerId { get; set; }
        public Customer Owner { get; set; } = null!;
        public string Name { get; set; } = null!;
        [MaxLength(2048)] public string? PhotoUrl { get; set; }
        public AnimalSpecies Species { get; set; }
        public string? Breed { get; set; }
        public DateOnly BirthDate { get; set; }
        public AnimalSex? Sex { get; set; }
        public string? MicrochipNumber { get; set; }
        public List<string> Allergies { get; set; } = new();
        public List<string> ChronicConditions { get; set; } = new();
        public bool IsActive { get; set; } = true;
    }
}

namespace VetSaas.Shared.Infrastructure.Persistence
{
    using VetSaas.Modules.Customers.Domain;

    public partial class TenantDbContext
    {
        public DbSet<DocumentType> DocumentTypes => Set<DocumentType>();
        public DbSet<Customer> Customers => Set<Customer>();
        public DbSet<Animal> Animals => Set<Animal>();
    }
}

namespace VetSaas.Modules.Customers.Infrastructure
{
    using VetSaas.Modules.Customers.Domain;

    public sealed class DocumentTypeConfiguration : IEntityTypeConfiguration<DocumentType>
    {
        public void Configure(EntityTypeBuilder<DocumentType> builder) => builder.HasIndex(d => d.Name).IsUnique();
    }

    public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
    {
        public void Configure(EntityTypeBuilder<Customer> builder)
        {
            builder.HasIndex(c => c.Email).IsUnique();
            builder.HasIndex(c => c.PhoneNumber).IsUnique();
            builder.HasIndex(c => c.DocumentNumber).IsUnique();
        }
    }

    public sealed class AnimalConfiguration : IEntityTypeConfiguration<Animal>
    {
        public void Configure(EntityTypeBuilder<Animal> builder)
        {
            builder.HasIndex(a => a.MicrochipNumber).IsUnique();
            builder.HasOne(a => a.Owner).WithMany().HasForeignKey(a => a.OwnerId);
        }
    }
}
