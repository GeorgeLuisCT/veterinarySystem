using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Customers.Application;
using VetSaas.Modules.Customers.Endpoints;
using VetSaas.Modules.Employees.Application;
using VetSaas.Modules.Employees.Endpoints;
using VetSaas.Modules.Finance;
using VetSaas.Modules.Inventory.Application;
using VetSaas.Modules.Inventory.Endpoints;
using VetSaas.Modules.Platform;
using VetSaas.Modules.Users.Application;
using VetSaas.Modules.Users.Endpoints;
using VetSaas.Modules.Users.Infrastructure;
using VetSaas.Shared.Infrastructure.Tenancy;

namespace VetSaas;

/// <summary>Registro de servicios y rutas de cada módulo, en un solo lugar.</summary>
public static class ModuleRegistration
{
    public static IServiceCollection AddModules(this IServiceCollection services)
    {
        // Plataforma
        services.AddScoped<IPlatformService, PlatformService>();

        // Núcleo: usuarios, empleados, sucursales
        services.AddScoped<ITenantSeeder, CoreTenantSeeder>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<IBranchService, BranchService>();

        // Clientes y pacientes
        services.AddScoped<ITenantSeeder, CustomerTenantSeeder>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IAnimalService, AnimalService>();

        // Inventario
        services.AddScoped<IKardexService, KardexService>();
        services.AddScoped<IInventoryConsumptionService, InventoryConsumptionService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICategoryProductService, CategoryProductService>();
        services.AddScoped<ISupplierService, SupplierService>();
        services.AddScoped<IInventoryMovementService, InventoryMovementService>();

        // Finanzas
        services.AddScoped<IAccountMovementService, AccountMovementService>();
        services.AddScoped<IAccountPayableService, AccountPayableService>();
        services.AddScoped<IPurchasePayableRegistrar>(sp => sp.GetRequiredService<IAccountPayableService>());
        services.AddScoped<ITreasuryService, TreasuryService>();

        return services;
    }

    public static void MapModules(this WebApplication app)
    {
        app.MapPlatformEndpoints();
        app.MapUserEndpoints();
        app.MapEmployeeEndpoints();
        app.MapCustomerEndpoints();
        app.MapInventoryEndpoints();
        app.MapFinanceEndpoints();
    }
}
