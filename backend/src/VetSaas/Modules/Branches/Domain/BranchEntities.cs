using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VetSaas.Modules.Employees.Domain;

namespace VetSaas.Modules.Branches.Domain;

/// <summary>Datos comerciales de la veterinaria (razón social y rubro). Hay una por empresa: el aislamiento lo da el schema.</summary>
[Table("companies")]
public class Company
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string Industry { get; set; } = null!;
    public ICollection<Branch> Branches { get; set; } = new HashSet<Branch>();
}

[Table("branches")]
public class Branch
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public string Location { get; set; } = null!;
    public long CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public ICollection<EmployeeBranch> EmployeeBranches { get; set; } = new HashSet<EmployeeBranch>();
    public ICollection<OperatingRoom> OperatingRooms { get; set; } = new HashSet<OperatingRoom>();
}

[Table("laboratories")]
public class Laboratory
{
    public long Id { get; set; }
    [MaxLength(120)] public string Name { get; set; } = null!;
    public long BranchId { get; set; }
    public Branch Branch { get; set; } = null!;
    [MaxLength(120)] public string? ContactName { get; set; }
    [MaxLength(120)] public string? ContactPhone { get; set; }
    [MaxLength(120)] public string? ContactEmail { get; set; }
    public string? Notes { get; set; }
}

/// <summary>Quirófano / sala de cirugía de una sucursal.</summary>
[Table("operating_rooms")]
public class OperatingRoom
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public long BranchId { get; set; }
    public Branch Branch { get; set; } = null!;
    public string? Notes { get; set; }
}
