using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Modules.Users.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;

namespace VetSaas.Modules.Employees.Application;

public record BaseEmployeeRequest
{
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Email { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Burden { get; init; }
}

public sealed record EmployeeCreateRequest : BaseEmployeeRequest
{
    public HashSet<long>? BranchIds { get; init; }
}

public sealed record EmployeeUpdateRequest : BaseEmployeeRequest
{
    public long? Id { get; init; }
}

public abstract class BaseEmployeeValidator<T> : AbstractValidator<T> where T : BaseEmployeeRequest
{
    protected BaseEmployeeValidator()
    {
        RuleFor(r => r.FirstName).NotEmpty().WithMessage("El nombre no puede estar vacío");
        RuleFor(r => r.LastName).NotEmpty().WithMessage("El apellido no puede estar vacío");
        RuleFor(r => r.Email).NotEmpty().WithMessage("El correo es obligatorio")
            .EmailAddress().WithMessage("Debe ingresar un correo válido");
        RuleFor(r => r.PhoneNumber).MaximumLength(15).WithMessage("El número de teléfono no debe exceder los 15 caracteres");
        RuleFor(r => r.Burden).NotEmpty().WithMessage("El cargo es obligatorio");
    }
}

public sealed class EmployeeCreateRequestValidator : BaseEmployeeValidator<EmployeeCreateRequest>
{
    public EmployeeCreateRequestValidator() =>
        RuleFor(r => r.BranchIds).NotEmpty().WithMessage("Debes seleccionar al menos una sucursal");
}

public sealed class EmployeeUpdateRequestValidator : BaseEmployeeValidator<EmployeeUpdateRequest>
{
    public EmployeeUpdateRequestValidator() =>
        RuleFor(r => r.Id).NotNull().WithMessage("El ID del empleado es obligatorio");
}

public sealed record EmployeeBranchResponse(long Id, long BranchId, string BranchName, bool Active);

public sealed record EmployeeResponse(
    long Id,
    string FirstName,
    string LastName,
    string Email,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? PhoneNumber,
    string Burden,
    List<EmployeeBranchResponse> Branches);

public sealed record EmployeeSummaryResponse(long Id, string FirstName, string LastName, string Email,
    string? PhoneNumber, string Burden, string BranchNames, bool Active)
{
    public static EmployeeSummaryResponse From(Employee employee) => new(
        employee.Id, employee.FirstName, employee.LastName, employee.Email, employee.PhoneNumber, employee.Burden,
        string.Join(", ", employee.EmployeeBranches.Select(eb => eb.Branch.Name).Distinct()),
        employee.EmployeeBranches.All(eb => eb.Active));
}

public sealed record EmployeeQuickSearchResponse(long Id, string FullName, string Email);

public interface IEmployeeService
{
    Task<EmployeeSummaryResponse> CreateAsync(EmployeeCreateRequest request, CancellationToken ct = default);
    Task<EmployeeResponse> GetAsync(long id, CancellationToken ct = default);
    Task<PaginatedResponse<EmployeeSummaryResponse>> ListAsync(int page, int size, string? q, long? branchId, bool? active, CancellationToken ct = default);
    Task<List<EmployeeQuickSearchResponse>> QuickSearchAsync(string? name, long? branchId, CancellationToken ct = default);
    Task<EmployeeSummaryResponse> UpdateAsync(EmployeeUpdateRequest request, CancellationToken ct = default);
    Task SoftDeleteAsync(long employeeId, long? branchId, CancellationToken ct = default);
    Task HardDeleteAsync(long employeeId, CancellationToken ct = default);
    Task<EmployeeSummaryResponse> RestoreAsync(long employeeId, long? branchId, CancellationToken ct = default);
    Task<List<EmployeeSummaryResponse>> GetByUserRolesAndBranchAsync(IReadOnlyCollection<RoleName> roles, long branchId, CancellationToken ct = default);
}

public sealed class EmployeeService : IEmployeeService
{
    private readonly TenantDbContext _db;

    public EmployeeService(TenantDbContext db) => _db = db;

    private IQueryable<Employee> WithBranches() =>
        _db.Employees.Include(e => e.EmployeeBranches).ThenInclude(eb => eb.Branch);

    private async Task<Employee> RequireAsync(long id, CancellationToken ct) =>
        await WithBranches().FirstOrDefaultAsync(e => e.Id == id, ct) ?? throw new NotFoundException("Empleado no encontrado");

    public async Task<EmployeeSummaryResponse> CreateAsync(EmployeeCreateRequest request, CancellationToken ct = default)
    {
        if (await _db.Employees.AnyAsync(e => e.Email == request.Email, ct))
            throw new BadRequestException("El correo electrónico ya está en uso");

        // El empleado queda enlazado a todas las sucursales; solo las elegidas quedan activas.
        List<Branch> branches = await _db.Branches.ToListAsync(ct);
        var employee = new Employee
        {
            FirstName = request.FirstName!,
            LastName = request.LastName!,
            Email = request.Email!,
            PhoneNumber = request.PhoneNumber,
            Burden = request.Burden!,
        };
        foreach (Branch branch in branches)
            employee.EmployeeBranches.Add(new EmployeeBranch
            {
                Employee = employee, Branch = branch, Active = request.BranchIds!.Contains(branch.Id),
            });
        _db.Employees.Add(employee);
        await _db.SaveChangesAsync(ct);
        return EmployeeSummaryResponse.From(employee);
    }

    public async Task<EmployeeResponse> GetAsync(long id, CancellationToken ct = default)
    {
        Employee employee = await WithBranches().AsNoTracking().FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw new NotFoundException("Empleado no encontrado");
        return new EmployeeResponse(employee.Id, employee.FirstName, employee.LastName, employee.Email,
            employee.PhoneNumber, employee.Burden,
            employee.EmployeeBranches.OrderBy(eb => eb.BranchId)
                .Select(eb => new EmployeeBranchResponse(eb.BranchId, eb.BranchId, eb.Branch.Name, eb.Active)).ToList());
    }

    public async Task<PaginatedResponse<EmployeeSummaryResponse>> ListAsync(int page, int size, string? q, long? branchId,
        bool? active, CancellationToken ct = default)
    {
        IQueryable<Employee> query = WithBranches().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            string like = $"%{q.Trim()}%";
            query = query.Where(e =>
                EF.Functions.ILike(e.FirstName, like) || EF.Functions.ILike(e.LastName, like) ||
                EF.Functions.ILike(e.Email, like) || EF.Functions.ILike(e.PhoneNumber!, like));
        }
        bool byBranch = branchId is not null and not 0;
        if (byBranch || active is not null)
            query = query.Where(e => e.EmployeeBranches.Any(eb =>
                (!byBranch || eb.BranchId == branchId) && (active == null || eb.Active == active)));

        var result = await query.OrderBy(e => e.LastName).ThenBy(e => e.FirstName).ThenBy(e => e.Id)
            .ToPageAsync(page, size, ct);
        return result.Map(EmployeeSummaryResponse.From);
    }

    public async Task<List<EmployeeQuickSearchResponse>> QuickSearchAsync(string? name, long? branchId, CancellationToken ct = default)
    {
        // Solo empleados con alguna sucursal activa.
        IQueryable<Employee> query = _db.Employees.AsNoTracking().Where(e => e.EmployeeBranches.Any(eb => eb.Active));
        if (branchId is not null and not 0)
            query = query.Where(e => e.EmployeeBranches.Any(eb => eb.BranchId == branchId));
        if (!string.IsNullOrWhiteSpace(name))
        {
            string like = $"%{name.Trim()}%";
            query = query.Where(e =>
                EF.Functions.ILike(e.FirstName, like) || EF.Functions.ILike(e.LastName, like) || EF.Functions.ILike(e.Email, like));
        }
        return await query.OrderBy(e => e.LastName).Take(10)
            .Select(e => new EmployeeQuickSearchResponse(e.Id, e.FirstName + " " + e.LastName, e.Email))
            .ToListAsync(ct);
    }

    public async Task<EmployeeSummaryResponse> UpdateAsync(EmployeeUpdateRequest request, CancellationToken ct = default)
    {
        Employee employee = await RequireAsync(request.Id!.Value, ct);
        if (await _db.Employees.AnyAsync(e => e.Email == request.Email && e.Id != employee.Id, ct))
            throw new BadRequestException("El correo electrónico ya está en uso por otro empleado");
        employee.FirstName = request.FirstName!;
        employee.LastName = request.LastName!;
        employee.Email = request.Email!;
        employee.PhoneNumber = request.PhoneNumber;
        employee.Burden = request.Burden!;
        await _db.SaveChangesAsync(ct);
        return EmployeeSummaryResponse.From(employee);
    }

    public async Task SoftDeleteAsync(long employeeId, long? branchId, CancellationToken ct = default)
    {
        Employee employee = await RequireAsync(employeeId, ct);
        SetActive(employee, branchId, false);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<EmployeeSummaryResponse> RestoreAsync(long employeeId, long? branchId, CancellationToken ct = default)
    {
        Employee employee = await RequireAsync(employeeId, ct);
        SetActive(employee, branchId, true);
        await _db.SaveChangesAsync(ct);
        return EmployeeSummaryResponse.From(employee);
    }

    /// <summary>Sin sucursal (o 0) el cambio aplica a todas las sucursales del empleado.</summary>
    private static void SetActive(Employee employee, long? branchId, bool active)
    {
        if (branchId is null or 0)
        {
            foreach (EmployeeBranch link in employee.EmployeeBranches) link.Active = active;
            return;
        }
        EmployeeBranch target = employee.EmployeeBranches.FirstOrDefault(eb => eb.BranchId == branchId)
            ?? throw new NotFoundException("Sucursal no encontrada para este empleado");
        target.Active = active;
    }

    public async Task HardDeleteAsync(long employeeId, CancellationToken ct = default)
    {
        Employee employee = await RequireAsync(employeeId, ct);
        _db.Employees.Remove(employee);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<EmployeeSummaryResponse>> GetByUserRolesAndBranchAsync(IReadOnlyCollection<RoleName> roles,
        long branchId, CancellationToken ct = default)
    {
        List<Employee> employees = await WithBranches().AsNoTracking()
            .Where(e => e.EmployeeBranches.Any(eb => eb.BranchId == branchId && eb.Active))
            .Where(e => _db.Users.Any(u => u.EmployeeId == e.Id && u.Roles.Any(r => roles.Contains(r.Name))))
            .OrderBy(e => e.Id)
            .ToListAsync(ct);
        return employees.Select(EmployeeSummaryResponse.From).ToList();
    }
}
