using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Branches.Domain;
using VetSaas.Shared.Infrastructure.Persistence;

namespace VetSaas.Modules.Branches.Application;

public sealed record BranchResponse(long Id, string Name, string Location)
{
    public static BranchResponse From(Branch branch) => new(branch.Id, branch.Name, branch.Location);
}

public sealed record BranchSummaryResponse(long Id, string Name);

public sealed record BranchSelectionRequest(long? BranchId);

public sealed record PublicCompanyResponse(string Name, string Industry);

public sealed record LaboratoryResponse(long Id, string Name, long? BranchId, string? BranchName,
    string? ContactName, string? ContactPhone, string? ContactEmail, string? Notes);

public sealed record OperatingRoomResponse(long Id, string Name, long? BranchId, string? BranchName, string? Notes);

public interface IBranchService
{
    Task<List<BranchResponse>> GetAllAsync(string? search, CancellationToken ct = default);
    Task<List<BranchResponse>> GetByEmployeeAsync(long employeeId, CancellationToken ct = default);
    Task<List<LaboratoryResponse>> ListLaboratoriesAsync(long? branchId, CancellationToken ct = default);
    Task<List<OperatingRoomResponse>> ListOperatingRoomsAsync(long? branchId, CancellationToken ct = default);
}

public sealed class BranchService : IBranchService
{
    private readonly TenantDbContext _db;

    public BranchService(TenantDbContext db) => _db = db;

    public async Task<List<BranchResponse>> GetAllAsync(string? search, CancellationToken ct = default)
    {
        IQueryable<Branch> query = _db.Branches.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            string like = $"%{search.Trim()}%";
            query = query.Where(b => EF.Functions.ILike(b.Name, like));
        }
        return await query.OrderBy(b => b.Id).Select(b => new BranchResponse(b.Id, b.Name, b.Location)).ToListAsync(ct);
    }

    public async Task<List<BranchResponse>> GetByEmployeeAsync(long employeeId, CancellationToken ct = default) =>
        await _db.EmployeeBranches.AsNoTracking()
            .Where(eb => eb.EmployeeId == employeeId)
            .OrderBy(eb => eb.BranchId)
            .Select(eb => new BranchResponse(eb.Branch.Id, eb.Branch.Name, eb.Branch.Location))
            .ToListAsync(ct);

    public async Task<List<LaboratoryResponse>> ListLaboratoriesAsync(long? branchId, CancellationToken ct = default)
    {
        IQueryable<Laboratory> query = _db.Laboratories.AsNoTracking();
        if (branchId is > 0) query = query.Where(l => l.BranchId == branchId);
        return await query.OrderBy(l => l.Id)
            .Select(l => new LaboratoryResponse(l.Id, l.Name, l.BranchId, l.Branch.Name,
                l.ContactName, l.ContactPhone, l.ContactEmail, l.Notes))
            .ToListAsync(ct);
    }

    public async Task<List<OperatingRoomResponse>> ListOperatingRoomsAsync(long? branchId, CancellationToken ct = default)
    {
        IQueryable<OperatingRoom> query = _db.OperatingRooms.AsNoTracking();
        if (branchId is > 0) query = query.Where(r => r.BranchId == branchId);
        return await query.OrderBy(r => r.Id)
            .Select(r => new OperatingRoomResponse(r.Id, r.Name, r.BranchId, r.Branch.Name, r.Notes))
            .ToListAsync(ct);
    }
}
