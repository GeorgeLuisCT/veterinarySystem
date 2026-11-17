using System.ComponentModel.DataAnnotations.Schema;
using VetSaas.Modules.Employees.Domain;

namespace VetSaas.Modules.Users.Domain;

/// <summary>Roles del sistema. Los nombres viajan tal cual en el JWT y en la API.</summary>
public enum RoleName
{
    ROLE_USER,
    ROLE_ADMIN,
    ROLE_VETERINARIAN,
    ROLE_ASSISTANT,
    ROLE_RECEPTIONIST,
    ROLE_MANAGER,
    ROLE_GROOMER,
    ROLE_SUPERVISOR,
    ROLE_WAREHOUSE,
    ROLE_CASHIER
}

public static class RoleNameExtensions
{
    public static string Label(this RoleName role) => role switch
    {
        RoleName.ROLE_USER => "Cliente",
        RoleName.ROLE_ADMIN => "Administrador",
        RoleName.ROLE_VETERINARIAN => "Veterinario",
        RoleName.ROLE_ASSISTANT => "Asistente",
        RoleName.ROLE_RECEPTIONIST => "Recepcionista",
        RoleName.ROLE_MANAGER => "Gerente",
        RoleName.ROLE_GROOMER => "Peluquero",
        RoleName.ROLE_SUPERVISOR => "Supervisor",
        RoleName.ROLE_WAREHOUSE => "Encargado",
        RoleName.ROLE_CASHIER => "Cajero",
        _ => role.ToString()
    };
}

[Table("roles")]
public class Role
{
    public long Id { get; set; }
    public RoleName Name { get; set; }
}

[Table("users")]
public class User
{
    public long Id { get; set; }
    public string Username { get; set; } = null!;
    public string Password { get; set; } = null!;
    public ICollection<Role> Roles { get; set; } = new HashSet<Role>();
    public long EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public bool IsActive { get; set; } = true;
}
