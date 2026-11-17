using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Modules.Users.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Security;
using VetSaas.Shared.Infrastructure.Tenancy;

namespace VetSaas.Modules.Users.Application;

public interface IAuthService
{
    Task<AuthResponse> AuthenticateAsync(HttpContext context, LoginRequest request, CancellationToken ct = default);
    Task<TokenUpdateResponse> SelectBranchAsync(long? branchId, CancellationToken ct = default);
}

public sealed class AuthService : IAuthService
{
    private const string BadCredentials = "Usuario o contraseña incorrectos";

    private readonly TenantDbContext _db;
    private readonly ITenantContext _tenant;
    private readonly ITenantResolver _resolver;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtService _jwt;
    private readonly ICurrentUser _currentUser;

    public AuthService(TenantDbContext db, ITenantContext tenant, ITenantResolver resolver, IPasswordHasher hasher,
        IJwtService jwt, ICurrentUser currentUser)
    {
        _db = db;
        _tenant = tenant;
        _resolver = resolver;
        _hasher = hasher;
        _jwt = jwt;
        _currentUser = currentUser;
    }

    public async Task<AuthResponse> AuthenticateAsync(HttpContext context, LoginRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrEmpty(request.Password))
            throw new UnauthorizedException(BadCredentials);

        // La empresa decide en qué schema se busca al usuario. Si no se puede determinar, se responde igual
        // que con una contraseña equivocada: no se revela qué empresas existen.
        TenantInfo? tenant = await _resolver.ResolveAnonymousAsync(context, request.Company, ct);
        if (tenant is null) throw new UnauthorizedException(BadCredentials);
        if (tenant.Status != TenantStatus.ACTIVE)
            throw new UnauthorizedException("La empresa está suspendida. Contacta al proveedor del servicio");
        _tenant.Use(tenant);

        User? user = await AuthBundle().FirstOrDefaultAsync(u => u.Username == request.Username, ct);
        if (user is null || !_hasher.Verify(request.Password, user.Password))
            throw new UnauthorizedException(BadCredentials);
        if (!user.IsActive)
            throw new UnauthorizedException("El usuario está desactivado. Contacta al administrador");

        List<BranchResponse> branches = user.Employee.EmployeeBranches
            .Where(eb => eb.Active)
            .OrderBy(eb => eb.BranchId)
            .Select(eb => BranchResponse.From(eb.Branch))
            .ToList();
        if (branches.Count == 0)
            throw new UnauthorizedException("El usuario no tiene sucursales activas asignadas");

        // Con una sola sucursal la sesión ya queda en ella; con varias, el usuario elige después (select-branch).
        long? branchId = branches.Count == 1 ? branches[0].Id : null;
        string token = _jwt.CreateUserToken(tenant.Slug, user.Id, user.EmployeeId, user.Username, RoleNames(user), branchId);
        return new AuthResponse(token, branches.Count > 1 ? branches : new List<BranchResponse>());
    }

    public async Task<TokenUpdateResponse> SelectBranchAsync(long? branchId, CancellationToken ct = default)
    {
        long userId = _currentUser.RequireUserId();
        User user = await AuthBundle().FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new UnauthorizedException("No se pudo autenticar la solicitud");
        if (!user.IsActive) throw new ForbiddenException("Usuario desactivado");

        // Solo se puede operar en sucursales activas asignadas al empleado del usuario.
        bool belongs = branchId is not null
            && user.Employee.EmployeeBranches.Any(eb => eb.Active && eb.BranchId == branchId);
        if (!belongs) throw new ForbiddenException("No tienes acceso a la sucursal seleccionada");

        string token = _jwt.CreateUserToken(_tenant.Current!.Slug, user.Id, user.EmployeeId, user.Username,
            RoleNames(user), branchId);
        return new TokenUpdateResponse(token);
    }

    private IQueryable<User> AuthBundle() => _db.Users.AsNoTracking()
        .Include(u => u.Roles)
        .Include(u => u.Employee).ThenInclude(e => e.EmployeeBranches).ThenInclude(eb => eb.Branch)
        .AsSplitQuery();

    private static List<string> RoleNames(User user) => user.Roles.Select(r => r.Name.ToString()).ToList();
}

public interface IUserService
{
    Task<UserInfoResponse> GetUserInfoAsync(long userId, long? branchId, CancellationToken ct = default);
    Task<UserDetailResponse> GetUserDetailAsync(long userId, CancellationToken ct = default);
    Task<PaginatedResponse<UserSummaryResponse>> GetAllUsersAsync(long? branchId, bool active, int page, int size,
        string? query, CancellationToken ct = default);
    Task<UserSummaryResponse> UpdateUserStatusAsync(long userId, bool active, long? actorUserId, CancellationToken ct = default);
    Task DeleteUserAsync(long userId, long? actorUserId, CancellationToken ct = default);
    Task<UserSummaryResponse> RegisterUserAsync(RegisterRequest request, CancellationToken ct = default);
}

public sealed class UserService : IUserService
{
    private readonly TenantDbContext _db;
    private readonly IPasswordHasher _hasher;

    public UserService(TenantDbContext db, IPasswordHasher hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    private IQueryable<User> Bundle() => _db.Users
        .Include(u => u.Roles)
        .Include(u => u.Employee).ThenInclude(e => e.EmployeeBranches).ThenInclude(eb => eb.Branch)
        .AsSplitQuery();

    private async Task<User> RequireAsync(long userId, CancellationToken ct) =>
        await Bundle().FirstOrDefaultAsync(u => u.Id == userId, ct) ?? throw new NotFoundException("User not found");

    public async Task<UserInfoResponse> GetUserInfoAsync(long userId, long? branchId, CancellationToken ct = default)
    {
        User user = await Bundle().AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User not found");
        Employee employee = user.Employee;
        List<BranchResponse> branches = employee.EmployeeBranches.OrderBy(eb => eb.BranchId)
            .Select(eb => BranchResponse.From(eb.Branch)).ToList();

        BranchResponse selected = branchId is null or 0
            ? new BranchResponse(0, "Todas las sucursales", "-")
            : branches.FirstOrDefault(b => b.Id == branchId)
              ?? throw new NotFoundException("Sucursal no encontrada para este usuario");

        return new UserInfoResponse(user.Id, user.Username, user.Roles.Select(r => r.Name.ToString()).ToList(), selected,
            employee.Id, employee.FirstName, employee.LastName, employee.Email, employee.PhoneNumber, employee.Burden, branches);
    }

    public async Task<UserDetailResponse> GetUserDetailAsync(long userId, CancellationToken ct = default)
    {
        User user = await Bundle().AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("User not found");
        Employee employee = user.Employee;
        return new UserDetailResponse(user.Id, user.Username, user.IsActive, user.Roles.Select(r => r.Name).ToList(),
            employee.Id, employee.FirstName, employee.LastName, employee.Email, employee.PhoneNumber, employee.Burden,
            employee.EmployeeBranches.OrderBy(eb => eb.BranchId).Select(eb => BranchResponse.From(eb.Branch)).ToList());
    }

    public async Task<PaginatedResponse<UserSummaryResponse>> GetAllUsersAsync(long? branchId, bool active, int page,
        int size, string? query, CancellationToken ct = default)
    {
        IQueryable<User> users = _db.Users.AsNoTracking().Where(u => u.IsActive == active);
        if (branchId is not null and not 0)
            users = users.Where(u => u.Employee.EmployeeBranches.Any(eb => eb.BranchId == branchId));
        if (!string.IsNullOrWhiteSpace(query))
        {
            string like = $"%{query.Trim()}%";
            users = users.Where(u =>
                EF.Functions.ILike(u.Username, like) ||
                EF.Functions.ILike(u.Employee.FirstName, like) ||
                EF.Functions.ILike(u.Employee.LastName, like) ||
                EF.Functions.ILike(u.Employee.Email, like) ||
                EF.Functions.ILike(u.Employee.PhoneNumber ?? "", like));
        }

        page = Math.Max(page, 0);
        size = Math.Max(size, 1);
        long total = await users.LongCountAsync(ct);
        List<User> rows = await users.OrderBy(u => u.Id).Skip(page * size).Take(size)
            .Include(u => u.Roles)
            .Include(u => u.Employee).ThenInclude(e => e.EmployeeBranches).ThenInclude(eb => eb.Branch)
            .AsSplitQuery()
            .ToListAsync(ct);
        return PaginatedResponse<UserSummaryResponse>.Of(rows.Select(ToSummary).ToList(), total, page, size);
    }

    public async Task<UserSummaryResponse> UpdateUserStatusAsync(long userId, bool active, long? actorUserId,
        CancellationToken ct = default)
    {
        User user = await RequireAsync(userId, ct);
        if (!active)
        {
            AssertNotSelf(userId, actorUserId, "desactivar");
            await AssertNotLastAdminAsync(user, "desactivar", ct);
        }
        user.IsActive = active;
        await _db.SaveChangesAsync(ct);
        return ToSummary(user);
    }

    public async Task DeleteUserAsync(long userId, long? actorUserId, CancellationToken ct = default)
    {
        User user = await RequireAsync(userId, ct);
        AssertNotSelf(userId, actorUserId, "eliminar");
        await AssertNotLastAdminAsync(user, "eliminar", ct);
        if (user.Employee.EmployeeBranches.Any(eb => eb.Active))
            throw new BusinessRuleException("No se puede eliminar el usuario porque el empleado asociado tiene sucursales activas.");
        _db.Users.Remove(user);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<UserSummaryResponse> RegisterUserAsync(RegisterRequest request, CancellationToken ct = default)
    {
        string username = request.Username!.Trim();
        if (await _db.Users.AnyAsync(u => u.Username == username, ct))
            throw new BadRequestException("Username is already taken");

        Employee employee = await _db.Employees
                                .Include(e => e.EmployeeBranches).ThenInclude(eb => eb.Branch)
                                .FirstOrDefaultAsync(e => e.Id == request.EmployeeId, ct)
                            ?? throw new NotFoundException("Employee not found");
        if (await _db.Users.AnyAsync(u => u.EmployeeId == employee.Id, ct))
            throw new BadRequestException("El empleado ya tiene un usuario asociado");

        List<Role> roles = await _db.Roles.Where(r => request.Roles!.Contains(r.Name)).ToListAsync(ct);
        RoleName? missing = request.Roles!.Cast<RoleName?>().FirstOrDefault(name => roles.All(r => r.Name != name));
        if (missing is not null) throw new NotFoundException("Role not found: " + missing);

        var user = new User
        {
            Username = username,
            Password = _hasher.Hash(request.Password!),
            IsActive = true,
            Employee = employee,
        };
        foreach (Role role in roles) user.Roles.Add(role);
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return ToSummary(user);
    }

    private static void AssertNotSelf(long userId, long? actorUserId, string action)
    {
        if (actorUserId == userId)
            throw new BusinessRuleException($"No puedes {action} tu propio usuario");
    }

    /// <summary>El sistema no puede quedarse sin ningún administrador activo.</summary>
    private async Task AssertNotLastAdminAsync(User user, string action, CancellationToken ct)
    {
        bool isAdmin = user.IsActive && user.Roles.Any(r => r.Name == RoleName.ROLE_ADMIN);
        if (!isAdmin) return;
        long activeAdmins = await _db.Users.LongCountAsync(
            u => u.IsActive && u.Roles.Any(r => r.Name == RoleName.ROLE_ADMIN), ct);
        if (activeAdmins <= 1)
            throw new BusinessRuleException($"No se puede {action} al único administrador activo del sistema");
    }

    private static UserSummaryResponse ToSummary(User user)
    {
        Employee employee = user.Employee;
        string branchNames = string.Join(", ", employee.EmployeeBranches.Select(eb => eb.Branch.Name).Distinct());
        return new UserSummaryResponse(user.Id, user.Username, user.Roles.Count,
            $"{employee.FirstName} {employee.LastName}", employee.Email, employee.PhoneNumber, employee.Burden,
            branchNames, user.IsActive);
    }
}
