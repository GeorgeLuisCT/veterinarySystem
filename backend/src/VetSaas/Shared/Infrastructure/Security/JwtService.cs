using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace VetSaas.Shared.Infrastructure.Security;

public static class AppClaims
{
    public const string UserId = "userId";
    public const string EmployeeId = "employeeId";
    public const string BranchId = "branchId";
    public const string Roles = "roles";
    /// <summary>Slug de la empresa a la que pertenece la sesión.</summary>
    public const string Tenant = "tenant";
    public const string IsSuperAdmin = "is_superadmin";
    public const string AdminId = "adminId";
}

public sealed class JwtOptions
{
    public string Secret { get; set; } = "";
    /// <summary>Duración del token en milisegundos (por omisión, 24 h).</summary>
    public long ExpirationMs { get; set; } = 86_400_000;

    /// <summary>La clave se acepta en Base64 (como en el backend anterior) o como texto plano.</summary>
    public SymmetricSecurityKey SigningKey()
    {
        if (string.IsNullOrWhiteSpace(Secret))
            throw new InvalidOperationException("Falta la clave de firma del JWT (Jwt:Secret / JWT_SECRET).");
        byte[] key;
        try { key = Convert.FromBase64String(Secret); }
        catch (FormatException) { key = Encoding.UTF8.GetBytes(Secret); }
        if (key.Length < 32)
            throw new InvalidOperationException("La clave del JWT debe tener al menos 256 bits.");
        return new SymmetricSecurityKey(key);
    }
}

public interface IJwtService
{
    string CreateUserToken(string tenantSlug, long userId, long employeeId, string username, IEnumerable<string> roles, long? branchId);
    string CreatePlatformToken(Guid adminId, string email);
}

public sealed class JwtService : IJwtService
{
    private readonly JwtOptions _options;
    private readonly SigningCredentials _credentials;

    public JwtService(JwtOptions options)
    {
        _options = options;
        _credentials = new SigningCredentials(options.SigningKey(), SecurityAlgorithms.HmacSha256);
    }

    public string CreateUserToken(string tenantSlug, long userId, long employeeId, string username,
        IEnumerable<string> roles, long? branchId)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, username),
            new(AppClaims.Tenant, tenantSlug),
            new(AppClaims.UserId, userId.ToString(), ClaimValueTypes.Integer64),
            new(AppClaims.EmployeeId, employeeId.ToString(), ClaimValueTypes.Integer64),
        };
        claims.AddRange(roles.Select(role => new Claim(AppClaims.Roles, role)));
        if (branchId is not null)
            claims.Add(new Claim(AppClaims.BranchId, branchId.Value.ToString(), ClaimValueTypes.Integer64));
        return Write(claims);
    }

    public string CreatePlatformToken(Guid adminId, string email) => Write(new List<Claim>
    {
        new(JwtRegisteredClaimNames.Sub, email),
        new(AppClaims.AdminId, adminId.ToString()),
        new(AppClaims.IsSuperAdmin, "true"),
    });

    private string Write(IEnumerable<Claim> claims)
    {
        DateTime now = DateTime.UtcNow;
        var token = new JwtSecurityToken(claims: claims, notBefore: now,
            expires: now.AddMilliseconds(_options.ExpirationMs), signingCredentials: _credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
