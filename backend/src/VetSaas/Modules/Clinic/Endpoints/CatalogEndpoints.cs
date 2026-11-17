using VetSaas.Modules.Clinic.Application;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Validation;

namespace VetSaas.Modules.Clinic.Endpoints;

public static class CatalogEndpoints
{
    public static void MapClinicCatalogEndpoints(this WebApplication app)
    {
        // ---- Servicios clínicos ----
        var services = app.MapGroup("/api/clinical-services").WithTags("Clinic catalogs");

        services.MapGet("/", async (ICurrentUser user, IClinicalServiceService s, CancellationToken ct, int page = 0, int size = 10,
                string? q = null, ClinicalServiceCategory? category = null) =>
            Results.Ok(await s.ListAsync(page, size, q, category, user.BranchId ?? 0, ct)));

        services.MapGet("/detail", async (long id, IClinicalServiceService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));

        services.MapPost("/", async (CreateClinicalServiceRequest r, IClinicalServiceService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(r, ct))).Validate<CreateClinicalServiceRequest>();

        services.MapPut("/", async (long id, UpdateClinicalServiceRequest r, IClinicalServiceService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(id, r, ct))).Validate<UpdateClinicalServiceRequest>();

        services.MapPatch("/branch-activation", async (long id, BranchActivationInput r, IClinicalServiceService s, CancellationToken ct) =>
        {
            if (r.BranchId is null || r.Active is null)
                throw new Shared.Application.ValidationFailedException("La sucursal y el estado son obligatorios");
            return Results.Ok(await s.SetBranchActivationAsync(id, r.BranchId.Value, r.Active.Value, ct));
        });

        services.MapDelete("/", async (long id, IClinicalServiceService s, CancellationToken ct) => Results.Ok(await s.DeleteAsync(id, ct)));

        services.MapGet("/quick-search", async (string name, IClinicalServiceService s, CancellationToken ct, long? branchId = null,
                ClinicalServiceCategory? category = null) =>
            Results.Ok(await s.QuickSearchAsync(name, branchId, category, ct)));

        // ---- Planes de salud ----
        var plans = app.MapGroup("/api/health-plans").WithTags("Clinic catalogs");

        plans.MapGet("/", async (IHealthPlanService s, CancellationToken ct, int page = 0, int size = 10, string? q = null) =>
            Results.Ok(await s.ListAsync(page, size, q, ct)));
        plans.MapGet("/detail", async (long id, IHealthPlanService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        plans.MapPost("/", async (CreateHealthPlanRequest r, IHealthPlanService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(r, ct))).Validate<CreateHealthPlanRequest>();
        plans.MapPut("/", async (long id, UpdateHealthPlanRequest r, IHealthPlanService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(id, r, ct))).Validate<UpdateHealthPlanRequest>();
        plans.MapDelete("/", async (long id, IHealthPlanService s, CancellationToken ct) => Results.Ok(await s.DeleteAsync(id, ct)));

        // ---- Plantillas de receta ----
        var templates = app.MapGroup("/api/prescription-templates").WithTags("Clinic catalogs");

        templates.MapGet("/", async (IPrescriptionTemplateService s, CancellationToken ct, int page = 0, int size = 10, string? q = null) =>
            Results.Ok(await s.ListAsync(page, size, q, ct)));
        templates.MapGet("/detail", async (long id, IPrescriptionTemplateService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        templates.MapGet("/quick-search", async (IPrescriptionTemplateService s, CancellationToken ct, string? query = null) =>
            Results.Ok(await s.QuickSearchAsync(query, ct)));
        templates.MapPost("/", async (CreatePrescriptionTemplateRequest r, IPrescriptionTemplateService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(r, ct))).Validate<CreatePrescriptionTemplateRequest>();
        templates.MapPut("/", async (long id, UpdatePrescriptionTemplateRequest r, IPrescriptionTemplateService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(id, r, ct))).Validate<UpdatePrescriptionTemplateRequest>();
        templates.MapDelete("/", async (long id, IPrescriptionTemplateService s, CancellationToken ct) => Results.Ok(await s.DeleteAsync(id, ct)));

        // ---- Pruebas de laboratorio ----
        var tests = app.MapGroup("/api/laboratory-tests").WithTags("Clinic catalogs");

        tests.MapGet("/", async (ILaboratoryTestService s, CancellationToken ct, int page = 0, int size = 10, string? q = null,
                long? laboratoryId = null) => Results.Ok(await s.ListAsync(page, size, q, laboratoryId, ct)));
        tests.MapGet("/{id:long}", async (long id, ILaboratoryTestService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));
        tests.MapPost("/", async (CreateLaboratoryTestRequest r, ILaboratoryTestService s, CancellationToken ct) =>
            Results.Ok(await s.CreateAsync(r, ct))).Validate<CreateLaboratoryTestRequest>();
        tests.MapPut("/{id:long}", async (long id, UpdateLaboratoryTestRequest r, ILaboratoryTestService s, CancellationToken ct) =>
            Results.Ok(await s.UpdateAsync(id, r, ct))).Validate<UpdateLaboratoryTestRequest>();
        tests.MapPatch("/laboratory-activation", async (long id, LaboratoryActivationInput r, ILaboratoryTestService s, CancellationToken ct) =>
        {
            if (r.LaboratoryId is null || r.Active is null)
                throw new Shared.Application.ValidationFailedException("El laboratorio y el estado son obligatorios");
            return Results.Ok(await s.SetLaboratoryActivationAsync(id, r.LaboratoryId.Value, r.Active.Value, ct));
        });
        tests.MapDelete("/{id:long}", async (long id, ILaboratoryTestService s, CancellationToken ct) => Results.Ok(await s.DeleteAsync(id, ct)));
        tests.MapGet("/quick-search", async (string name, ILaboratoryTestService s, CancellationToken ct, long? laboratoryId = null) =>
            Results.Ok(await s.QuickSearchAsync(name, laboratoryId, ct)));
    }
}
