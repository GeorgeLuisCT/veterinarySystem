using FluentValidation;
using VetSaas.Modules.Branches.Application;
using VetSaas.Modules.Users.Domain;

namespace VetSaas.Modules.Users.Application;

/// <param name="Company">Identificador de la empresa. Opcional si la instalación tiene una sola o llega por subdominio/cabecera.</param>
public sealed record LoginRequest(string? Username, string? Password, string? Company);

public sealed record AuthResponse(string Token, IReadOnlyList<BranchResponse> Branches);

public sealed record TokenUpdateResponse(string Token);

public sealed record RegisterRequest(string? Username, string? Password, HashSet<RoleName>? Roles, long? EmployeeId);

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(r => r.Username).NotEmpty().WithMessage("El usuario es obligatorio");
        RuleFor(r => r.Password).NotEmpty().WithMessage("La contraseña es obligatoria");
        RuleFor(r => r.Roles).NotEmpty().WithMessage("Debes seleccionar al menos un rol");
        RuleFor(r => r.EmployeeId).NotNull().WithMessage("El empleado es obligatorio");
    }
}

public sealed record UserStatusUpdateRequest(bool? Active);

public sealed class UserStatusUpdateRequestValidator : AbstractValidator<UserStatusUpdateRequest>
{
    public UserStatusUpdateRequestValidator() =>
        RuleFor(r => r.Active).NotNull().WithMessage("El estado es obligatorio");
}

public sealed record UserSummaryResponse(
    long UserId,
    string Username,
    int CantRoles,
    string FullName,
    string Email,
    string? PhoneNumber,
    string Burden,
    string? BranchNames,
    bool Active);

public sealed record UserDetailResponse(
    long UserId,
    string Username,
    bool Active,
    IReadOnlyCollection<RoleName> Roles,
    long EmployeeId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    string Burden,
    IReadOnlyCollection<BranchResponse> Branches);

public sealed record UserInfoResponse(
    long UserId,
    string Username,
    IReadOnlyCollection<string> Roles,
    BranchResponse SelectedBranch,
    long EmployeeId,
    string FirstName,
    string LastName,
    string Email,
    string? PhoneNumber,
    string Burden,
    IReadOnlyCollection<BranchResponse> Branches);
