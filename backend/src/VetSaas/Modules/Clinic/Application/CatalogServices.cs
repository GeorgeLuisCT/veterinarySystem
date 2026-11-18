using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;

namespace VetSaas.Modules.Clinic.Application;

internal static class Text
{
    public static string? TrimToNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

// =====================================================================================================
// Servicios clínicos
// =====================================================================================================

public sealed record BranchActivationInput(long? BranchId, bool? Active);
public sealed record BranchStateResponse(long BranchId, string BranchName, bool Active);
public sealed record ClinicalServiceRequiredProductResponse(long Id, string Name, string Sku);

public record CreateClinicalServiceRequest
{
    public string? Name { get; init; }
    public ClinicalServiceCategory? ClinicalServiceCategory { get; init; }
    public string? Description { get; init; }
    public decimal? Price { get; init; }
    public int? ReminderPeriod { get; init; }
    public TimeUnit? ReminderPeriodUnit { get; init; }
    public HashSet<string?>? RequiredSampleTypes { get; init; }
    public HashSet<long?>? RequiredProductIds { get; init; }
    public List<BranchActivationInput>? Branches { get; init; }
}

public sealed record UpdateClinicalServiceRequest : CreateClinicalServiceRequest;

public class CreateClinicalServiceRequestValidator<T> : AbstractValidator<T> where T : CreateClinicalServiceRequest
{
    public CreateClinicalServiceRequestValidator()
    {
        RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre no debe estar vacío");
        RuleFor(r => r.ClinicalServiceCategory).NotNull().WithMessage("La categoría es obligatoria");
        RuleFor(r => r.Price).NotNull().WithMessage("El precio es obligatorio").GreaterThanOrEqualTo(0).WithMessage("El precio no puede ser negativo");
        RuleFor(r => r.ReminderPeriod).GreaterThanOrEqualTo(0).When(r => r.ReminderPeriod is not null).WithMessage("El período no puede ser negativo");
        RuleFor(r => r).Must(r => (r.ReminderPeriod is null) == (r.ReminderPeriodUnit is null))
            .WithMessage("El período y su unidad de tiempo deben especificarse juntos.");
    }
}

public sealed class CreateClinicalServiceValidator : CreateClinicalServiceRequestValidator<CreateClinicalServiceRequest>;
public sealed class UpdateClinicalServiceValidator : CreateClinicalServiceRequestValidator<UpdateClinicalServiceRequest>;

public record ClinicalServiceSummaryResponse(long Id, string Name, ClinicalServiceCategory ClinicalServiceCategory,
    string? Description, decimal Price, IReadOnlyList<BranchStateResponse> Branches);

public sealed record ClinicalServiceResponse(long Id, string Name, ClinicalServiceCategory ClinicalServiceCategory,
    string? Description, decimal Price, IReadOnlyList<BranchStateResponse> Branches, int? ReminderPeriod,
    TimeUnit? ReminderPeriodUnit, IReadOnlyCollection<string> RequiredSampleTypes,
    IReadOnlyList<ClinicalServiceRequiredProductResponse> RequiredProducts);

public sealed record ClinicalServiceQuickSearchResponse(long Id, string Name, ClinicalServiceCategory Category, decimal Price);

public interface IClinicalServiceService
{
    Task<PaginatedResponse<ClinicalServiceSummaryResponse>> ListAsync(int page, int size, string? q, ClinicalServiceCategory? category, long branchIdOrZero, CancellationToken ct = default);
    Task<ClinicalServiceResponse> GetAsync(long id, CancellationToken ct = default);
    Task<ClinicalServiceResponse> CreateAsync(CreateClinicalServiceRequest r, CancellationToken ct = default);
    Task<ClinicalServiceResponse> UpdateAsync(long id, UpdateClinicalServiceRequest r, CancellationToken ct = default);
    Task<ClinicalServiceSummaryResponse> DeleteAsync(long id, CancellationToken ct = default);
    Task<ClinicalServiceSummaryResponse> SetBranchActivationAsync(long id, long branchId, bool active, CancellationToken ct = default);
    Task<List<ClinicalServiceQuickSearchResponse>> QuickSearchAsync(string? name, long? branchId, ClinicalServiceCategory? category, CancellationToken ct = default);
}

public sealed class ClinicalServiceService : IClinicalServiceService
{
    private readonly TenantDbContext _db;

    public ClinicalServiceService(TenantDbContext db) => _db = db;

    private IQueryable<ClinicalService> Full() => _db.ClinicalServices
        .Include(s => s.BranchLinks).ThenInclude(l => l.Branch)
        .Include(s => s.RequiredProducts)
        .AsSplitQuery();

    private async Task<ClinicalService> RequireAsync(long id, CancellationToken ct) =>
        await Full().FirstOrDefaultAsync(s => s.Id == id, ct)
        ?? throw new InvalidArgumentException("ClinicalService no encontrado: id=" + id);

    private static List<BranchStateResponse> Branches(ClinicalService s) =>
        s.BranchLinks.OrderBy(l => l.BranchId).Select(l => new BranchStateResponse(l.BranchId, l.Branch.Name, l.IsActive)).ToList();

    internal static ClinicalServiceSummaryResponse ToSummary(ClinicalService s) =>
        new(s.Id, s.Name, s.ClinicalServiceCategory, s.Description, s.Price, Branches(s));

    private static ClinicalServiceResponse ToResponse(ClinicalService s) => new(s.Id, s.Name, s.ClinicalServiceCategory,
        s.Description, s.Price, Branches(s), s.ReminderPeriod, s.ReminderPeriodUnit, s.RequiredSampleTypes.ToList(),
        s.RequiredProducts.OrderBy(p => p.Id).Select(p => new ClinicalServiceRequiredProductResponse(p.Id, p.Name, p.Sku)).ToList());

    public async Task<PaginatedResponse<ClinicalServiceSummaryResponse>> ListAsync(int page, int size, string? q,
        ClinicalServiceCategory? category, long branchIdOrZero, CancellationToken ct = default)
    {
        IQueryable<ClinicalService> query = _db.ClinicalServices.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            string like = $"%{q.Trim()}%";
            query = query.Where(s => EF.Functions.ILike(s.Name, like) || EF.Functions.ILike(s.Description ?? "", like));
        }
        if (category is not null) query = query.Where(s => s.ClinicalServiceCategory == category);
        if (branchIdOrZero != 0) query = query.Where(s => s.BranchLinks.Any(l => l.BranchId == branchIdOrZero));

        page = Math.Max(page, 0);
        size = Math.Max(size, 1);
        long total = await query.LongCountAsync(ct);
        List<long> ids = await query.OrderBy(s => s.Name).ThenBy(s => s.Id).Skip(page * size).Take(size).Select(s => s.Id).ToListAsync(ct);
        var rows = await Full().AsNoTracking().Where(s => ids.Contains(s.Id)).ToListAsync(ct);
        return PaginatedResponse<ClinicalServiceSummaryResponse>.Of(
            rows.OrderBy(s => ids.IndexOf(s.Id)).Select(ToSummary).ToList(), total, page, size);
    }

    public async Task<ClinicalServiceResponse> GetAsync(long id, CancellationToken ct = default) => ToResponse(await RequireAsync(id, ct));

    public Task<ClinicalServiceResponse> CreateAsync(CreateClinicalServiceRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            string name = r.Name!.Trim();
            if (await _db.ClinicalServices.AnyAsync(s => s.Name.ToLower() == name.ToLower(), ct))
                throw new InvalidArgumentException("Ya existe un servicio con ese nombre.");
            var service = new ClinicalService();
            Apply(service, r);
            await SyncRequiredProductsAsync(service, r.RequiredProductIds, ct);
            await SyncBranchLinksAsync(service, r.Branches, ct);
            _db.ClinicalServices.Add(service);
            await _db.SaveChangesAsync(ct);
            return ToResponse(service);
        }, ct);

    public Task<ClinicalServiceResponse> UpdateAsync(long id, UpdateClinicalServiceRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            ClinicalService service = await RequireAsync(id, ct);
            string name = r.Name!.Trim();
            if (!service.Name.Equals(name, StringComparison.OrdinalIgnoreCase) &&
                await _db.ClinicalServices.AnyAsync(s => s.Name.ToLower() == name.ToLower(), ct))
                throw new InvalidArgumentException("Ya existe un servicio con ese nombre.");
            Apply(service, r);
            await SyncRequiredProductsAsync(service, r.RequiredProductIds, ct);
            if (r.Branches is not null) await SyncBranchLinksAsync(service, r.Branches, ct);
            await _db.SaveChangesAsync(ct);
            return ToResponse(service);
        }, ct);

    private static void Apply(ClinicalService s, CreateClinicalServiceRequest r)
    {
        s.Name = r.Name!.Trim();
        s.ClinicalServiceCategory = r.ClinicalServiceCategory!.Value;
        s.Description = Text.TrimToNull(r.Description);
        s.Price = r.Price!.Value;
        s.ReminderPeriod = r.ReminderPeriod;
        s.ReminderPeriodUnit = r.ReminderPeriodUnit;
        s.RequiredSampleTypes = (r.RequiredSampleTypes ?? new()).Select(Text.TrimToNull).Where(v => v is not null)
            .Select(v => v!).Distinct().ToList();
    }

    private async Task SyncRequiredProductsAsync(ClinicalService service, HashSet<long?>? requested, CancellationToken ct)
    {
        service.RequiredProducts.Clear();
        var ids = (requested ?? new()).Where(id => id is not null).Select(id => id!.Value).ToHashSet();
        if (ids.Count == 0) return;
        List<Product> products = await _db.Products.Where(p => ids.Contains(p.Id)).ToListAsync(ct);
        var missing = ids.Except(products.Select(p => p.Id)).ToList();
        if (missing.Count > 0) throw new InvalidArgumentException($"Productos requeridos no encontrados: [{string.Join(", ", missing)}]");
        foreach (Product product in products) service.RequiredProducts.Add(product);
    }

    /// <summary>El servicio queda enlazado a todas las sucursales; activo solo donde se indicó.</summary>
    private async Task SyncBranchLinksAsync(ClinicalService service, List<BranchActivationInput>? inputs, CancellationToken ct)
    {
        var requested = new Dictionary<long, bool>();
        foreach (BranchActivationInput input in inputs ?? new())
            if (input.BranchId is not null) requested[input.BranchId.Value] = input.Active == true;
        List<Branch> branches = await _db.Branches.ToListAsync(ct);
        var unknown = requested.Keys.Except(branches.Select(b => b.Id)).ToList();
        if (unknown.Count > 0) throw new InvalidArgumentException($"Sucursales no existen: [{string.Join(", ", unknown)}]");
        foreach (Branch branch in branches)
        {
            bool active = requested.GetValueOrDefault(branch.Id);
            BranchClinicalService? link = service.BranchLinks.FirstOrDefault(l => l.BranchId == branch.Id);
            if (link is null) service.BranchLinks.Add(new BranchClinicalService { Branch = branch, BranchId = branch.Id, ClinicalService = service, IsActive = active });
            else link.IsActive = active;
        }
    }

    public Task<ClinicalServiceSummaryResponse> DeleteAsync(long id, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            ClinicalService service = await RequireAsync(id, ct);
            ClinicalServiceSummaryResponse summary = ToSummary(service);
            _db.ClinicalServices.Remove(service);
            await _db.SaveChangesAsync(ct);
            return summary;
        }, ct);

    public Task<ClinicalServiceSummaryResponse> SetBranchActivationAsync(long id, long branchId, bool active, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            ClinicalService service = await RequireAsync(id, ct);
            BranchClinicalService? link = service.BranchLinks.FirstOrDefault(l => l.BranchId == branchId);
            if (link is null)
            {
                Branch branch = await _db.Branches.FirstOrDefaultAsync(b => b.Id == branchId, ct)
                    ?? throw new NotFoundException("Sucursal no encontrada");
                link = new BranchClinicalService { Branch = branch, BranchId = branchId, ClinicalService = service };
                service.BranchLinks.Add(link);
            }
            link.IsActive = active;
            await _db.SaveChangesAsync(ct);
            return ToSummary(service);
        }, ct);

    public async Task<List<ClinicalServiceQuickSearchResponse>> QuickSearchAsync(string? name, long? branchId,
        ClinicalServiceCategory? category, CancellationToken ct = default)
    {
        long? branch = branchId is null or 0 ? null : branchId;
        IQueryable<ClinicalService> query = _db.ClinicalServices.AsNoTracking()
            .Where(s => s.BranchLinks.Any(l => (branch == null || l.BranchId == branch) && l.IsActive));
        if (branch is not null) query = query.Where(s => s.BranchLinks.Any(l => l.BranchId == branch));
        if (category is not null) query = query.Where(s => s.ClinicalServiceCategory == category);
        if (!string.IsNullOrWhiteSpace(name))
        {
            string like = $"%{name.Trim()}%";
            query = query.Where(s => EF.Functions.ILike(s.Name, like));
        }
        return await query.OrderBy(s => s.Name).Take(10)
            .Select(s => new ClinicalServiceQuickSearchResponse(s.Id, s.Name, s.ClinicalServiceCategory, s.Price)).ToListAsync(ct);
    }
}

// =====================================================================================================
// Planes de salud
// =====================================================================================================

public sealed record HealthPlanServiceItemRequest(long? ClinicalServiceId, int? Quantity, string? Notes);

public record CreateHealthPlanRequest
{
    public string? Name { get; init; }
    public string? Description { get; init; }
    public decimal? Price { get; init; }
    public string? Notes { get; init; }
    public List<HealthPlanServiceItemRequest>? ServiceItems { get; init; }
}

public sealed record UpdateHealthPlanRequest : CreateHealthPlanRequest;

public class HealthPlanRequestValidator<T> : AbstractValidator<T> where T : CreateHealthPlanRequest
{
    public HealthPlanRequestValidator()
    {
        RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre no debe estar vacío");
        RuleFor(r => r.Price).NotNull().WithMessage("El precio es obligatorio").GreaterThan(0).WithMessage("El precio debe ser mayor a cero.");
        RuleFor(r => r.ServiceItems).NotEmpty().WithMessage("Debe registrar al menos un servicio en el plan.");
        RuleForEach(r => r.ServiceItems).ChildRules(i =>
        {
            i.RuleFor(x => x.ClinicalServiceId).NotNull().WithMessage("El servicio clínico es obligatorio");
            i.RuleFor(x => x.Quantity).NotNull().WithMessage("La cantidad es obligatoria")
                .GreaterThanOrEqualTo(1).WithMessage("La cantidad debe ser mayor o igual a 1.");
        });
        RuleFor(r => r.ServiceItems).Must(items =>
        {
            if (items is null) return false;
            var seen = new HashSet<long>();
            return items.All(i => i?.ClinicalServiceId is not null && seen.Add(i.ClinicalServiceId.Value));
        }).WithMessage("Cada servicio clínico solo puede agregarse una vez.");
    }
}

public sealed class CreateHealthPlanValidator : HealthPlanRequestValidator<CreateHealthPlanRequest>;
public sealed class UpdateHealthPlanValidator : HealthPlanRequestValidator<UpdateHealthPlanRequest>;

public sealed record HealthPlanServiceItemResponse(long Id, long ClinicalServiceId, string ClinicalServiceName, int Quantity, string? Notes);

public sealed record HealthPlanResponse(long Id, string Name, string? Description, decimal Price, string? Notes,
    IReadOnlyList<HealthPlanServiceItemResponse> ServiceItems);

public interface IHealthPlanService
{
    Task<PaginatedResponse<HealthPlanResponse>> ListAsync(int page, int size, string? q, CancellationToken ct = default);
    Task<HealthPlanResponse> GetAsync(long id, CancellationToken ct = default);
    Task<HealthPlanResponse> CreateAsync(CreateHealthPlanRequest r, CancellationToken ct = default);
    Task<HealthPlanResponse> UpdateAsync(long id, UpdateHealthPlanRequest r, CancellationToken ct = default);
    Task<HealthPlanResponse> DeleteAsync(long id, CancellationToken ct = default);
}

public sealed class HealthPlanService : IHealthPlanService
{
    private readonly TenantDbContext _db;

    public HealthPlanService(TenantDbContext db) => _db = db;

    private IQueryable<HealthPlan> Full() => _db.HealthPlans.Include(p => p.ServiceItems).ThenInclude(i => i.ClinicalService);

    private static HealthPlanResponse ToResponse(HealthPlan p) => new(p.Id, p.Name, p.Description, p.Price, p.Notes,
        p.ServiceItems.OrderBy(i => i.Id).Select(i => new HealthPlanServiceItemResponse(i.Id, i.ClinicalServiceId,
            i.ClinicalService.Name, i.Quantity, i.Notes)).ToList());

    private async Task<HealthPlan> RequireAsync(long id, CancellationToken ct) =>
        await Full().FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new InvalidArgumentException("HealthPlan no encontrado: id=" + id);

    public async Task<PaginatedResponse<HealthPlanResponse>> ListAsync(int page, int size, string? q, CancellationToken ct = default)
    {
        IQueryable<HealthPlan> query = Full().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            string like = $"%{q.Trim()}%";
            query = query.Where(p => EF.Functions.ILike(p.Name, like) || EF.Functions.ILike(p.Description ?? "", like) ||
                                     p.ServiceItems.Any(i => EF.Functions.ILike(i.ClinicalService.Name, like)));
        }
        var result = await query.OrderBy(p => p.Name).ThenBy(p => p.Id).ToPageAsync(page, size, ct);
        return result.Map(ToResponse);
    }

    public async Task<HealthPlanResponse> GetAsync(long id, CancellationToken ct = default) => ToResponse(await RequireAsync(id, ct));

    public Task<HealthPlanResponse> CreateAsync(CreateHealthPlanRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            string name = r.Name!.Trim();
            if (await _db.HealthPlans.AnyAsync(p => p.Name.ToLower() == name.ToLower(), ct))
                throw new InvalidArgumentException("Ya existe un plan de salud con ese nombre.");
            var plan = new HealthPlan();
            Apply(plan, r);
            await OverwriteItemsAsync(plan, r.ServiceItems, ct);
            _db.HealthPlans.Add(plan);
            await _db.SaveChangesAsync(ct);
            return ToResponse(plan);
        }, ct);

    public Task<HealthPlanResponse> UpdateAsync(long id, UpdateHealthPlanRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            HealthPlan plan = await RequireAsync(id, ct);
            string name = r.Name!.Trim();
            if (!plan.Name.Equals(name, StringComparison.OrdinalIgnoreCase) &&
                await _db.HealthPlans.AnyAsync(p => p.Name.ToLower() == name.ToLower(), ct))
                throw new InvalidArgumentException("Ya existe un plan de salud con ese nombre.");
            Apply(plan, r);
            await OverwriteItemsAsync(plan, r.ServiceItems, ct);
            await _db.SaveChangesAsync(ct);
            return ToResponse(plan);
        }, ct);

    private static void Apply(HealthPlan plan, CreateHealthPlanRequest r)
    {
        plan.Name = r.Name!.Trim();
        plan.Description = Text.TrimToNull(r.Description);
        plan.Price = r.Price!.Value;
        plan.Notes = Text.TrimToNull(r.Notes);
    }

    private async Task OverwriteItemsAsync(HealthPlan plan, List<HealthPlanServiceItemRequest>? requests, CancellationToken ct)
    {
        if (requests is null || requests.Count == 0) throw new InvalidArgumentException("Debe registrar al menos un servicio en el plan.");
        var ids = requests.Where(r => r.ClinicalServiceId is not null).Select(r => r.ClinicalServiceId!.Value).ToHashSet();
        var services = await _db.ClinicalServices.Where(s => ids.Contains(s.Id)).ToDictionaryAsync(s => s.Id, ct);
        var missing = ids.Except(services.Keys).ToList();
        if (missing.Count > 0) throw new InvalidArgumentException($"Servicios clínicos no encontrados: [{string.Join(", ", missing)}]");
        foreach (HealthPlanServiceItem old in plan.ServiceItems.ToList()) _db.HealthPlanServiceItems.Remove(old);
        plan.ServiceItems.Clear();
        foreach (HealthPlanServiceItemRequest request in requests)
            plan.ServiceItems.Add(new HealthPlanServiceItem
            {
                HealthPlan = plan,
                ClinicalService = services[request.ClinicalServiceId!.Value],
                Quantity = request.Quantity!.Value,
                Notes = Text.TrimToNull(request.Notes),
            });
    }

    public Task<HealthPlanResponse> DeleteAsync(long id, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            HealthPlan plan = await RequireAsync(id, ct);
            HealthPlanResponse response = ToResponse(plan);
            _db.HealthPlans.Remove(plan);
            await _db.SaveChangesAsync(ct);
            return response;
        }, ct);
}

// =====================================================================================================
// Plantillas de receta
// =====================================================================================================

public sealed record PrescriptionTemplateMedicationRequest(long? ProductId, string? CustomMedicationName, decimal? DosageAmount,
    ProductUnitType? DosageUnit, int? FrequencyValue, FrequencyUnit? FrequencyUnit, int? DurationValue, TimeUnit? DurationUnit,
    string? Instructions);

public record CreatePrescriptionTemplateRequest
{
    public string? Name { get; init; }
    public string? Purpose { get; init; }
    public string? Notes { get; init; }
    public List<PrescriptionTemplateMedicationRequest>? Medications { get; init; }
}

public sealed record UpdatePrescriptionTemplateRequest : CreatePrescriptionTemplateRequest;

public class PrescriptionTemplateRequestValidator<T> : AbstractValidator<T> where T : CreatePrescriptionTemplateRequest
{
    public PrescriptionTemplateRequestValidator()
    {
        RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre no debe estar vacío");
        RuleFor(r => r.Purpose).NotEmpty().WithMessage("El propósito no debe estar vacío");
        RuleFor(r => r.Medications).NotEmpty().WithMessage("Debe registrar al menos un medicamento en la plantilla.");
        RuleForEach(r => r.Medications).ChildRules(m =>
        {
            m.RuleFor(x => x.DosageAmount).NotNull().WithMessage("La dosis es obligatoria").GreaterThan(0).WithMessage("La dosis debe ser mayor a cero.");
            m.RuleFor(x => x.FrequencyValue).NotNull().WithMessage("La frecuencia es obligatoria")
                .GreaterThanOrEqualTo(1).WithMessage("La frecuencia debe ser mayor o igual a 1.");
            m.RuleFor(x => x.FrequencyUnit).NotNull().WithMessage("La unidad de frecuencia es obligatoria");
            m.RuleFor(x => x.DurationValue).NotNull().WithMessage("La duración es obligatoria")
                .GreaterThanOrEqualTo(1).WithMessage("La duración debe ser mayor o igual a 1.");
            m.RuleFor(x => x.DurationUnit).NotNull().WithMessage("La unidad de duración es obligatoria");
        });
        RuleFor(r => r.Medications).Must(meds => meds is { Count: > 0 } &&
                                                 meds.All(m => m.ProductId is not null || !string.IsNullOrWhiteSpace(m.CustomMedicationName)))
            .WithMessage("Cada medicamento debe tener un producto o un nombre personalizado.");
        RuleFor(r => r.Medications).Must(meds => meds is null || meds.Where(m => m.ProductId is not null).All(m => m.DosageUnit is not null))
            .WithMessage("Cuando se seleccione un producto de inventario, la unidad de dosificación es obligatoria.");
    }
}

public sealed class CreatePrescriptionTemplateValidator : PrescriptionTemplateRequestValidator<CreatePrescriptionTemplateRequest>;
public sealed class UpdatePrescriptionTemplateValidator : PrescriptionTemplateRequestValidator<UpdatePrescriptionTemplateRequest>;

public sealed record PrescriptionTemplateMedicationResponse(long Id, long? ProductId, string? ProductName, string? CustomMedicationName,
    decimal DosageAmount, ProductUnitType? DosageUnit, int FrequencyValue, FrequencyUnit FrequencyUnit, int DurationValue,
    TimeUnit DurationUnit, string? Instructions);

public sealed record PrescriptionTemplateResponse(long Id, string Name, string Purpose, string? Notes,
    IReadOnlyList<PrescriptionTemplateMedicationResponse> Medications);

public sealed record PrescriptionTemplateSummaryResponse(long Id, string Name, string Purpose, int MedicationCount);

public sealed record PrescriptionTemplateQuickSearchResponse(long Id, string Name, string Purpose, string NotesSnippet, int MedicationsCount);

public interface IPrescriptionTemplateService
{
    Task<PaginatedResponse<PrescriptionTemplateResponse>> ListAsync(int page, int size, string? q, CancellationToken ct = default);
    Task<PrescriptionTemplateResponse> GetAsync(long id, CancellationToken ct = default);
    Task<List<PrescriptionTemplateQuickSearchResponse>> QuickSearchAsync(string? query, CancellationToken ct = default);
    Task<PrescriptionTemplateResponse> CreateAsync(CreatePrescriptionTemplateRequest r, CancellationToken ct = default);
    Task<PrescriptionTemplateResponse> UpdateAsync(long id, UpdatePrescriptionTemplateRequest r, CancellationToken ct = default);
    Task<PrescriptionTemplateSummaryResponse> DeleteAsync(long id, CancellationToken ct = default);
}

public sealed class PrescriptionTemplateService : IPrescriptionTemplateService
{
    private readonly TenantDbContext _db;

    public PrescriptionTemplateService(TenantDbContext db) => _db = db;

    private IQueryable<PrescriptionTemplate> Full() => _db.PrescriptionTemplates.Include(t => t.Medications).ThenInclude(m => m.Product);

    private static PrescriptionTemplateResponse ToResponse(PrescriptionTemplate t) => new(t.Id, t.Name, t.Purpose, t.Notes,
        t.Medications.OrderBy(m => m.Id).Select(m => new PrescriptionTemplateMedicationResponse(m.Id, m.ProductId, m.Product?.Name,
            m.CustomMedicationName, m.DosageAmount, m.DosageUnit, m.FrequencyValue, m.FrequencyUnit, m.DurationValue,
            m.DurationUnit, m.Instructions)).ToList());

    private async Task<PrescriptionTemplate> RequireAsync(long id, CancellationToken ct) =>
        await Full().FirstOrDefaultAsync(t => t.Id == id, ct) ?? throw new InvalidArgumentException("PrescriptionTemplate no encontrado: id=" + id);

    public async Task<PaginatedResponse<PrescriptionTemplateResponse>> ListAsync(int page, int size, string? q, CancellationToken ct = default)
    {
        IQueryable<PrescriptionTemplate> query = Full().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            string like = $"%{q.Trim()}%";
            query = query.Where(t => EF.Functions.ILike(t.Name, like) || EF.Functions.ILike(t.Purpose, like) ||
                                     t.Medications.Any(m => EF.Functions.ILike(m.Product != null ? m.Product.Name : "", like) ||
                                                            EF.Functions.ILike(m.CustomMedicationName ?? "", like)));
        }
        var result = await query.OrderBy(t => t.Name).ThenBy(t => t.Id).ToPageAsync(page, size, ct);
        return result.Map(ToResponse);
    }

    public async Task<PrescriptionTemplateResponse> GetAsync(long id, CancellationToken ct = default) => ToResponse(await RequireAsync(id, ct));

    public async Task<List<PrescriptionTemplateQuickSearchResponse>> QuickSearchAsync(string? query, CancellationToken ct = default)
    {
        IQueryable<PrescriptionTemplate> templates = _db.PrescriptionTemplates.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query))
        {
            string like = $"%{query.Trim()}%";
            templates = templates.Where(t => EF.Functions.ILike(t.Name, like) || EF.Functions.ILike(t.Purpose, like) ||
                                             EF.Functions.ILike(t.Notes ?? "", like) ||
                                             t.Medications.Any(m => EF.Functions.ILike(m.CustomMedicationName ?? "", like) ||
                                                                    (m.Product != null && EF.Functions.ILike(m.Product.Name, like))));
        }
        var rows = await templates.OrderBy(t => t.Name).Take(10)
            .Select(t => new { t.Id, t.Name, t.Purpose, Notes = t.Notes ?? "", Count = t.Medications.Count() }).ToListAsync(ct);
        return rows.Select(r => new PrescriptionTemplateQuickSearchResponse(r.Id, r.Name, r.Purpose,
            r.Notes.Length > 120 ? r.Notes[..120] : r.Notes, r.Count)).ToList();
    }

    public Task<PrescriptionTemplateResponse> CreateAsync(CreatePrescriptionTemplateRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            string name = r.Name!.Trim();
            if (await _db.PrescriptionTemplates.AnyAsync(t => t.Name.ToLower() == name.ToLower(), ct))
                throw new InvalidArgumentException("Ya existe una plantilla de receta con ese nombre.");
            var template = new PrescriptionTemplate();
            Apply(template, r);
            await OverwriteMedicationsAsync(template, r.Medications, ct);
            _db.PrescriptionTemplates.Add(template);
            await _db.SaveChangesAsync(ct);
            return ToResponse(template);
        }, ct);

    public Task<PrescriptionTemplateResponse> UpdateAsync(long id, UpdatePrescriptionTemplateRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            PrescriptionTemplate template = await RequireAsync(id, ct);
            string name = r.Name!.Trim();
            if (!template.Name.Equals(name, StringComparison.OrdinalIgnoreCase) &&
                await _db.PrescriptionTemplates.AnyAsync(t => t.Name.ToLower() == name.ToLower(), ct))
                throw new InvalidArgumentException("Ya existe una plantilla de receta con ese nombre.");
            Apply(template, r);
            await OverwriteMedicationsAsync(template, r.Medications, ct);
            await _db.SaveChangesAsync(ct);
            return ToResponse(template);
        }, ct);

    private static void Apply(PrescriptionTemplate t, CreatePrescriptionTemplateRequest r)
    {
        t.Name = r.Name!.Trim();
        t.Purpose = r.Purpose!.Trim();
        t.Notes = Text.TrimToNull(r.Notes);
    }

    private async Task OverwriteMedicationsAsync(PrescriptionTemplate template, List<PrescriptionTemplateMedicationRequest>? requests,
        CancellationToken ct)
    {
        if (requests is null || requests.Count == 0) throw new InvalidArgumentException("Debe registrar al menos un medicamento en la plantilla.");
        var ids = requests.Where(r => r.ProductId is not null).Select(r => r.ProductId!.Value).ToHashSet();
        var products = await _db.Products.Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
        var missing = ids.Except(products.Keys).ToList();
        if (missing.Count > 0) throw new InvalidArgumentException($"Productos no encontrados: [{string.Join(", ", missing)}]");

        foreach (PrescriptionTemplateMedication old in template.Medications.ToList()) _db.PrescriptionTemplateMedications.Remove(old);
        template.Medications.Clear();
        foreach (PrescriptionTemplateMedicationRequest request in requests)
        {
            Product? product = null;
            if (request.ProductId is not null)
            {
                product = products[request.ProductId.Value];
                if (request.DosageUnit is null)
                    throw new InvalidArgumentException("La unidad de dosificación es obligatoria para el producto: id=" + request.ProductId);
            }
            string? customName = Text.TrimToNull(request.CustomMedicationName);
            if (product is null && customName is null)
                throw new InvalidArgumentException("Se requiere un producto de inventario o un nombre personalizado para cada medicamento.");
            template.Medications.Add(new PrescriptionTemplateMedication
            {
                PrescriptionTemplate = template,
                Product = product,
                CustomMedicationName = customName,
                DosageAmount = request.DosageAmount!.Value,
                DosageUnit = request.DosageUnit,
                FrequencyValue = request.FrequencyValue!.Value,
                FrequencyUnit = request.FrequencyUnit!.Value,
                DurationValue = request.DurationValue!.Value,
                DurationUnit = request.DurationUnit!.Value,
                Instructions = Text.TrimToNull(request.Instructions),
            });
        }
    }

    public Task<PrescriptionTemplateSummaryResponse> DeleteAsync(long id, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            PrescriptionTemplate template = await RequireAsync(id, ct);
            var summary = new PrescriptionTemplateSummaryResponse(template.Id, template.Name, template.Purpose, template.Medications.Count);
            _db.PrescriptionTemplates.Remove(template);
            await _db.SaveChangesAsync(ct);
            return summary;
        }, ct);
}

// =====================================================================================================
// Pruebas de laboratorio
// =====================================================================================================

public sealed record LaboratoryActivationInput(long? LaboratoryId, bool? Active);
public sealed record LaboratoryStateResponse(long LaboratoryId, string LaboratoryName, bool Active);

public sealed record CreateLaboratoryTestParameterRequest(string? Name, LabValueType? ValueType, string? Unit, string? AllowedOptions,
    double? RefMin, double? RefMax, string? RefText, int? Decimals);

public record CreateLaboratoryTestRequest
{
    public string? Code { get; init; }
    public string? Name { get; init; }
    public string? Description { get; init; }
    public decimal? Price { get; init; }
    public bool Active { get; init; }
    public List<CreateLaboratoryTestParameterRequest>? Parameters { get; init; }
    public List<LaboratoryActivationInput>? Laboratories { get; init; }
}

public sealed record UpdateLaboratoryTestRequest : CreateLaboratoryTestRequest;

public class LaboratoryTestRequestValidator<T> : AbstractValidator<T> where T : CreateLaboratoryTestRequest
{
    public LaboratoryTestRequestValidator()
    {
        RuleFor(r => r.Code).NotEmpty().WithMessage("El código no debe estar vacío").MaximumLength(40).WithMessage("El código no debe superar 40 caracteres");
        RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre no debe estar vacío").MaximumLength(200).WithMessage("El nombre no debe superar 200 caracteres");
        RuleFor(r => r.Description).MaximumLength(1000).WithMessage("La descripción no debe superar 1000 caracteres");
        RuleFor(r => r.Price).NotNull().WithMessage("El precio es obligatorio").GreaterThan(0).WithMessage("El precio debe ser mayor a 0")
            .PrecisionScale(10, 2, true).WithMessage("El precio admite hasta 8 enteros y 2 decimales");
        RuleForEach(r => r.Parameters).ChildRules(p =>
        {
            p.RuleFor(x => x.Name).NotEmpty().WithMessage("El nombre del parámetro no debe estar vacío")
                .MaximumLength(80).WithMessage("El nombre del parámetro no debe superar 80 caracteres");
            p.RuleFor(x => x.ValueType).NotNull().WithMessage("El tipo de valor es obligatorio");
            p.RuleFor(x => x.Unit).NotNull().WithMessage("La unidad es obligatoria");
            p.RuleFor(x => x.AllowedOptions).MaximumLength(400).WithMessage("Las opciones no deben superar 400 caracteres");
            p.RuleFor(x => x.RefText).MaximumLength(200).WithMessage("El texto de referencia no debe superar 200 caracteres");
        });
    }
}

public sealed class CreateLaboratoryTestValidator : LaboratoryTestRequestValidator<CreateLaboratoryTestRequest>;
public sealed class UpdateLaboratoryTestValidator : LaboratoryTestRequestValidator<UpdateLaboratoryTestRequest>;

public sealed record LaboratoryTestParameterResponse(long Id, string Name, LabValueType ValueType, string Unit, string? AllowedOptions,
    double? RefMin, double? RefMax, string? RefText, int? Decimals)
{
    public static LaboratoryTestParameterResponse From(LaboratoryTestParameter p) =>
        new(p.Id, p.Name, p.ValueType, p.Unit, p.AllowedOptions, p.RefMin, p.RefMax, p.RefText, p.Decimals);
}

public record LaboratoryTestSummaryResponse(long Id, string Code, string Name, decimal Price, bool Active,
    IReadOnlyList<LaboratoryStateResponse> Laboratories);

public sealed record LaboratoryTestResponse(long Id, string Code, string Name, decimal Price, bool Active,
    IReadOnlyList<LaboratoryStateResponse> Laboratories, string? Description, IReadOnlyList<LaboratoryTestParameterResponse> Parameters);

public sealed record LaboratoryTestQuickSearchResponse(long Id, string Code, string Name, decimal Price);

public interface ILaboratoryTestService
{
    Task<PaginatedResponse<LaboratoryTestSummaryResponse>> ListAsync(int page, int size, string? q, long? laboratoryId, CancellationToken ct = default);
    Task<LaboratoryTestResponse> GetAsync(long id, CancellationToken ct = default);
    Task<LaboratoryTestResponse> CreateAsync(CreateLaboratoryTestRequest r, CancellationToken ct = default);
    Task<LaboratoryTestResponse> UpdateAsync(long id, UpdateLaboratoryTestRequest r, CancellationToken ct = default);
    Task<LaboratoryTestSummaryResponse> SetLaboratoryActivationAsync(long id, long laboratoryId, bool active, CancellationToken ct = default);
    Task<LaboratoryTestSummaryResponse> DeleteAsync(long id, CancellationToken ct = default);
    Task<List<LaboratoryTestQuickSearchResponse>> QuickSearchAsync(string? name, long? laboratoryId, CancellationToken ct = default);
}

public sealed class LaboratoryTestService : ILaboratoryTestService
{
    private readonly TenantDbContext _db;

    public LaboratoryTestService(TenantDbContext db) => _db = db;

    private IQueryable<LaboratoryTest> Full() => _db.LaboratoryTests
        .Include(t => t.Parameters)
        .Include(t => t.LaboratoryLinks).ThenInclude(l => l.Laboratory)
        .AsSplitQuery();

    private async Task<LaboratoryTest> RequireAsync(long id, CancellationToken ct) =>
        await Full().FirstOrDefaultAsync(t => t.Id == id, ct) ?? throw new InvalidArgumentException("LaboratoryTest no encontrado: id=" + id);

    private static List<LaboratoryStateResponse> Labs(LaboratoryTest t) => t.LaboratoryLinks.OrderBy(l => l.LaboratoryId)
        .Select(l => new LaboratoryStateResponse(l.LaboratoryId, l.Laboratory.Name, l.IsActive)).ToList();

    private static LaboratoryTestSummaryResponse ToSummary(LaboratoryTest t) => new(t.Id, t.Code, t.Name, t.Price, t.Active, Labs(t));

    private static LaboratoryTestResponse ToResponse(LaboratoryTest t) => new(t.Id, t.Code, t.Name, t.Price, t.Active, Labs(t),
        t.Description, t.Parameters.OrderBy(p => p.Id).Select(LaboratoryTestParameterResponse.From).ToList());

    public async Task<PaginatedResponse<LaboratoryTestSummaryResponse>> ListAsync(int page, int size, string? q, long? laboratoryId,
        CancellationToken ct = default)
    {
        IQueryable<LaboratoryTest> query = Full().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            string like = $"%{q.Trim()}%";
            query = query.Where(t => EF.Functions.ILike(t.Name, like) || EF.Functions.ILike(t.Code, like));
        }
        if (laboratoryId is > 0) query = query.Where(t => t.LaboratoryLinks.Any(l => l.LaboratoryId == laboratoryId && l.IsActive));
        var result = await query.OrderBy(t => t.Name).ThenBy(t => t.Id).ToPageAsync(page, size, ct);
        return result.Map(ToSummary);
    }

    public async Task<LaboratoryTestResponse> GetAsync(long id, CancellationToken ct = default) => ToResponse(await RequireAsync(id, ct));

    public Task<LaboratoryTestResponse> CreateAsync(CreateLaboratoryTestRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            string code = r.Code!.Trim();
            if (await _db.LaboratoryTests.AnyAsync(t => t.Code.ToLower() == code.ToLower(), ct))
                throw new InvalidArgumentException("Ya existe una prueba de laboratorio con ese código.");
            var test = new LaboratoryTest();
            Apply(test, r);
            await SyncLaboratoriesAsync(test, r.Laboratories, ct);
            _db.LaboratoryTests.Add(test);
            await _db.SaveChangesAsync(ct);
            return ToResponse(test);
        }, ct);

    public Task<LaboratoryTestResponse> UpdateAsync(long id, UpdateLaboratoryTestRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            LaboratoryTest test = await RequireAsync(id, ct);
            string code = r.Code!.Trim();
            if (!test.Code.Equals(code, StringComparison.OrdinalIgnoreCase) &&
                await _db.LaboratoryTests.AnyAsync(t => t.Code.ToLower() == code.ToLower(), ct))
                throw new InvalidArgumentException("Ya existe una prueba de laboratorio con ese código.");
            foreach (LaboratoryTestParameter old in test.Parameters.ToList()) _db.LaboratoryTestParameters.Remove(old);
            Apply(test, r);
            if (r.Laboratories is not null) await SyncLaboratoriesAsync(test, r.Laboratories, ct);
            await _db.SaveChangesAsync(ct);
            return ToResponse(test);
        }, ct);

    /// <summary>Los parámetros se reemplazan completos con los de la solicitud.</summary>
    private static void Apply(LaboratoryTest test, CreateLaboratoryTestRequest r)
    {
        test.Code = r.Code!.Trim();
        test.Name = r.Name!.Trim();
        test.Description = Text.TrimToNull(r.Description);
        test.Price = r.Price!.Value;
        test.Active = r.Active;
        test.Parameters.Clear();
        foreach (CreateLaboratoryTestParameterRequest p in r.Parameters ?? new())
            test.Parameters.Add(new LaboratoryTestParameter
            {
                Test = test, Name = p.Name!, ValueType = p.ValueType!.Value, Unit = p.Unit!, AllowedOptions = p.AllowedOptions,
                RefMin = p.RefMin, RefMax = p.RefMax, RefText = p.RefText, Decimals = p.Decimals,
            });
    }

    private async Task SyncLaboratoriesAsync(LaboratoryTest test, List<LaboratoryActivationInput>? inputs, CancellationToken ct)
    {
        var requested = new Dictionary<long, bool>();
        foreach (LaboratoryActivationInput input in inputs ?? new())
            if (input.LaboratoryId is not null) requested[input.LaboratoryId.Value] = input.Active == true;
        var labs = await _db.Laboratories.ToListAsync(ct);
        var unknown = requested.Keys.Except(labs.Select(l => l.Id)).ToList();
        if (unknown.Count > 0) throw new InvalidArgumentException($"Laboratorios no existen: [{string.Join(", ", unknown)}]");
        foreach (var lab in labs)
        {
            bool active = requested.GetValueOrDefault(lab.Id);
            LaboratoryTestLaboratory? link = test.LaboratoryLinks.FirstOrDefault(l => l.LaboratoryId == lab.Id);
            if (link is null) test.LaboratoryLinks.Add(new LaboratoryTestLaboratory { Laboratory = lab, LaboratoryId = lab.Id, LaboratoryTest = test, IsActive = active });
            else link.IsActive = active;
        }
    }

    public Task<LaboratoryTestSummaryResponse> SetLaboratoryActivationAsync(long id, long laboratoryId, bool active, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            LaboratoryTest test = await RequireAsync(id, ct);
            LaboratoryTestLaboratory? link = test.LaboratoryLinks.FirstOrDefault(l => l.LaboratoryId == laboratoryId);
            if (link is null)
            {
                var lab = await _db.Laboratories.FirstOrDefaultAsync(l => l.Id == laboratoryId, ct)
                    ?? throw new NotFoundException("Laboratorio no encontrado");
                link = new LaboratoryTestLaboratory { Laboratory = lab, LaboratoryId = lab.Id, LaboratoryTest = test };
                test.LaboratoryLinks.Add(link);
            }
            link.IsActive = active;
            await _db.SaveChangesAsync(ct);
            return ToSummary(test);
        }, ct);

    public Task<LaboratoryTestSummaryResponse> DeleteAsync(long id, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            LaboratoryTest test = await RequireAsync(id, ct);
            LaboratoryTestSummaryResponse summary = ToSummary(test);
            _db.LaboratoryTests.Remove(test);
            await _db.SaveChangesAsync(ct);
            return summary;
        }, ct);

    public async Task<List<LaboratoryTestQuickSearchResponse>> QuickSearchAsync(string? name, long? laboratoryId, CancellationToken ct = default)
    {
        long? lab = laboratoryId is null or 0 ? null : laboratoryId;
        IQueryable<LaboratoryTest> query = _db.LaboratoryTests.AsNoTracking().Where(t => t.Active);
        if (lab is not null) query = query.Where(t => t.LaboratoryLinks.Any(l => l.LaboratoryId == lab && l.IsActive));
        if (!string.IsNullOrWhiteSpace(name))
        {
            string like = $"%{name.Trim()}%";
            query = query.Where(t => EF.Functions.ILike(t.Name, like) || EF.Functions.ILike(t.Code, like));
        }
        return await query.OrderBy(t => t.Name).Take(20)
            .Select(t => new LaboratoryTestQuickSearchResponse(t.Id, t.Code, t.Name, t.Price)).ToListAsync(ct);
    }
}
