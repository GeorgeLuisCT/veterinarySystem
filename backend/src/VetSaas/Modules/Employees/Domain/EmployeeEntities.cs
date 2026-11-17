using System.ComponentModel.DataAnnotations.Schema;
using VetSaas.Modules.Branches.Domain;

namespace VetSaas.Modules.Employees.Domain;

[Table("employees")]
public class Employee
{
    public long Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    /// <summary>Cargo del empleado.</summary>
    public string Burden { get; set; } = null!;
    public string? CalendarColorHex { get; set; }
    public bool IsFieldVet { get; set; }
    public ICollection<EmployeeBranch> EmployeeBranches { get; set; } = new HashSet<EmployeeBranch>();

    [NotMapped]
    public string FullName => $"{FirstName?.Trim()} {LastName?.Trim()}".Trim();
}

/// <summary>Asignación de un empleado a una sucursal; «Active» es el interruptor de la baja lógica por sucursal.</summary>
[Table("employee_branch")]
public class EmployeeBranch
{
    public long Id { get; set; }
    public long EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public long BranchId { get; set; }
    public Branch Branch { get; set; } = null!;
    public bool Active { get; set; } = true;
}
