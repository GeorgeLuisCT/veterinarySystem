using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Modules.Users.Domain;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Tenancy;

namespace VetSaas.Modules.Users.Infrastructure;

/// <summary>
/// Lo mínimo para que una empresa pueda entrar: los roles del sistema y, en el alta, su razón social,
/// la primera sucursal y el administrador inicial (con todos los roles y todas las sucursales).
/// </summary>
public sealed class CoreTenantSeeder : ITenantSeeder
{
    private readonly IPasswordHasher _hasher;

    public CoreTenantSeeder(IPasswordHasher hasher) => _hasher = hasher;

    public int Order => 0;

    public async Task SeedAsync(TenantDbContext db, NewTenant? newTenant, CancellationToken ct)
    {
        // Los roles salen del enum: se crean los que falten (también al agregar uno nuevo en una versión posterior).
        List<RoleName> existing = await db.Roles.Select(r => r.Name).ToListAsync(ct);
        foreach (RoleName name in Enum.GetValues<RoleName>().Except(existing))
            db.Roles.Add(new Role { Name = name });
        await db.SaveChangesAsync(ct);

        if (newTenant is null) return;

        var company = new Company
        {
            Name = newTenant.Name.Trim(),
            Industry = string.IsNullOrWhiteSpace(newTenant.Industry) ? "Veterinaria" : newTenant.Industry.Trim(),
        };
        var branch = new Branch
        {
            Name = string.IsNullOrWhiteSpace(newTenant.BranchName) ? "Sucursal principal" : newTenant.BranchName.Trim(),
            Location = string.IsNullOrWhiteSpace(newTenant.BranchLocation) ? "-" : newTenant.BranchLocation.Trim(),
            Company = company,
        };
        db.Branches.Add(branch);

        var employee = new Employee
        {
            FirstName = "Admin",
            LastName = newTenant.Name.Trim(),
            Email = string.IsNullOrWhiteSpace(newTenant.AdminEmail)
                ? $"admin@{newTenant.Slug}.local"
                : newTenant.AdminEmail.Trim(),
            Burden = "Administrador",
        };
        employee.EmployeeBranches.Add(new EmployeeBranch { Employee = employee, Branch = branch, Active = true });
        db.Employees.Add(employee);

        var admin = new User
        {
            Username = newTenant.AdminUsername.Trim(),
            Password = _hasher.Hash(newTenant.AdminPassword),
            Employee = employee,
            IsActive = true,
        };
        foreach (Role role in await db.Roles.ToListAsync(ct)) admin.Roles.Add(role);
        db.Users.Add(admin);

        await db.SaveChangesAsync(ct);
    }
}
