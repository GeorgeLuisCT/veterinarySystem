using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Clinic.Application;
using VetSaas.Modules.Clinic.Endpoints;
using VetSaas.Modules.Customers.Application;
using VetSaas.Modules.Customers.Endpoints;
using VetSaas.Modules.Employees.Application;
using VetSaas.Modules.Employees.Endpoints;
using VetSaas.Modules.Finance;
using VetSaas.Modules.Inventory.Application;
using VetSaas.Modules.Inventory.Endpoints;
using VetSaas.Modules.Platform;
using VetSaas.Modules.Sales.Application;
using VetSaas.Modules.Sales.Endpoints;
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

        // Ventas y caja
        services.AddScoped<BillableServiceRegistry>();
        services.AddScoped<ISaleService, SaleService>();
        services.AddScoped<ICashSessionService, CashSessionService>();

        // Clínica: catálogos
        services.AddScoped<IClinicalServiceService, ClinicalServiceService>();
        services.AddScoped<IHealthPlanService, HealthPlanService>();
        services.AddScoped<IPrescriptionTemplateService, PrescriptionTemplateService>();
        services.AddScoped<ILaboratoryTestService, LaboratoryTestService>();

        // Clínica: agenda, recepción y consulta
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IAttentionService, AttentionService>();
        services.AddScoped<IClinicalAttentionService, ClinicalAttentionService>();
        services.AddScoped<VetSaas.Modules.Sales.Application.IBillableServiceAdapter, ClinicalServiceItemBillableAdapter>();
        services.AddScoped<VetSaas.Modules.Sales.Application.IBillableServiceAdapter, LaboratoryItemBillableAdapter>();

        // Clínica: hospitalización, cirugía, laboratorio, peluquería e historia
        services.AddScoped<ICageService, CageService>();
        services.AddScoped<IHospitalizationService, HospitalizationService>();
        services.AddScoped<ISurgicalOrderService, SurgicalOrderService>();
        services.AddScoped<ISurgicalReportService, SurgicalReportService>();
        services.AddScoped<ILaboratoryRequestService, LaboratoryRequestService>();
        services.AddScoped<IGroomingSessionService, GroomingSessionService>();
        services.AddScoped<VetSaas.Modules.Sales.Application.IBillableServiceAdapter, GroomingSessionBillableAdapter>();
        services.AddScoped<IMedicalRecordService, MedicalRecordService>();
        services.AddScoped<IReminderService, ReminderService>();
        services.AddScoped<IClinicalHistoryService, ClinicalHistoryService>();

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
        app.MapSalesEndpoints();
        app.MapClinicCatalogEndpoints();
        app.MapClinicCareEndpoints();
        app.MapClinicProcedureEndpoints();
    }
}
