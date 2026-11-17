using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Modules.Users.Domain;

namespace VetSaas.Shared.Infrastructure.Persistence
{
    public partial class TenantDbContext
    {
        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Employee> Employees => Set<Employee>();
        public DbSet<EmployeeBranch> EmployeeBranches => Set<EmployeeBranch>();
        public DbSet<Company> Companies => Set<Company>();
        public DbSet<Branch> Branches => Set<Branch>();
        public DbSet<Laboratory> Laboratories => Set<Laboratory>();
        public DbSet<OperatingRoom> OperatingRooms => Set<OperatingRoom>();
    }
}

namespace VetSaas.Modules.Users.Infrastructure
{
    public sealed class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.HasIndex(u => u.Username).IsUnique();
            builder.HasIndex(u => u.EmployeeId).IsUnique();
            builder.HasOne(u => u.Employee).WithOne().HasForeignKey<User>(u => u.EmployeeId);
            builder.HasMany(u => u.Roles).WithMany().UsingEntity(join => join.ToTable("user_roles"));
        }
    }

    public sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
    {
        public void Configure(EntityTypeBuilder<Role> builder) => builder.HasIndex(r => r.Name).IsUnique();
    }

    public sealed class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
    {
        public void Configure(EntityTypeBuilder<Employee> builder)
        {
            builder.HasIndex(e => e.Email).IsUnique();
            builder.HasMany(e => e.EmployeeBranches).WithOne(eb => eb.Employee)
                .HasForeignKey(eb => eb.EmployeeId).OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class BranchConfiguration : IEntityTypeConfiguration<Branch>
    {
        public void Configure(EntityTypeBuilder<Branch> builder)
        {
            builder.HasIndex(b => b.Name).IsUnique();
            builder.HasMany(b => b.EmployeeBranches).WithOne(eb => eb.Branch)
                .HasForeignKey(eb => eb.BranchId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(b => b.OperatingRooms).WithOne(room => room.Branch)
                .HasForeignKey(room => room.BranchId).OnDelete(DeleteBehavior.Cascade);
        }
    }

    public sealed class CompanyConfiguration : IEntityTypeConfiguration<Company>
    {
        public void Configure(EntityTypeBuilder<Company> builder) => builder.HasIndex(c => c.Name).IsUnique();
    }

    public sealed class LaboratoryConfiguration : IEntityTypeConfiguration<Laboratory>
    {
        public void Configure(EntityTypeBuilder<Laboratory> builder) => builder.HasIndex(l => l.Name).IsUnique();
    }
}
