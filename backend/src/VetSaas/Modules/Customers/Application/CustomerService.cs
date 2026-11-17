using System.Text.Json.Serialization;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Customers.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Tenancy;

namespace VetSaas.Modules.Customers.Application;

public record BaseCustomerRequest
{
    public string? Name { get; init; }
    public long? DocumentTypeId { get; init; }
    public string? DocumentNumber { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
    public string? Address { get; init; }
}

public sealed record CustomerCreateRequest : BaseCustomerRequest;

public sealed record CustomerUpdateRequest : BaseCustomerRequest
{
    public long? Id { get; init; }
}

public abstract class BaseCustomerValidator<T> : AbstractValidator<T> where T : BaseCustomerRequest
{
    protected BaseCustomerValidator()
    {
        RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre no puede estar vacío")
            .MaximumLength(100).WithMessage("El nombre no debe exceder los 100 caracteres");
        RuleFor(r => r.DocumentTypeId).NotNull().WithMessage("El tipo de documento es obligatorio");
        RuleFor(r => r.DocumentNumber).NotEmpty().WithMessage("El número de documento no puede estar vacío")
            .MaximumLength(50).WithMessage("El número de documento no debe exceder los 50 caracteres");
        RuleFor(r => r.PhoneNumber).MaximumLength(50).WithMessage("El número de teléfono no debe exceder los 50 caracteres");
        RuleFor(r => r.Email).EmailAddress().When(r => !string.IsNullOrEmpty(r.Email))
            .WithMessage("El correo electrónico debe ser válido")
            .MaximumLength(100).WithMessage("El correo electrónico no debe exceder los 100 caracteres");
        RuleFor(r => r.Address).MaximumLength(200).WithMessage("La dirección no debe exceder los 200 caracteres");
    }
}

public sealed class CustomerCreateRequestValidator : BaseCustomerValidator<CustomerCreateRequest>;

public sealed class CustomerUpdateRequestValidator : BaseCustomerValidator<CustomerUpdateRequest>
{
    public CustomerUpdateRequestValidator() =>
        RuleFor(r => r.Id).NotNull().WithMessage("El ID del cliente es obligatorio");
}

public sealed record DocumentTypeResponse(long Id, string Name, string? Abbreviation)
{
    public static DocumentTypeResponse From(DocumentType type) => new(type.Id, type.Name, type.Abbreviation);
}

/// <summary>Detalle del cliente; los campos sin valor no se envían.</summary>
public sealed record CustomerResponse(
    long Id,
    string Name,
    DocumentTypeResponse? DocumentType,
    string DocumentNumber,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? PhoneNumber,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Email,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? Address,
    bool IsActive)
{
    public static CustomerResponse From(Customer customer) => new(customer.Id, customer.Name,
        customer.DocumentType is null ? null : DocumentTypeResponse.From(customer.DocumentType),
        customer.DocumentNumber, customer.PhoneNumber, customer.Email, customer.Address, customer.IsActive);
}

public sealed record CustomerSummaryResponse(long Id, string Name, string DocumentNumber, string DocumentTypeName,
    string? PhoneNumber, string? Email, bool IsActive);

public sealed record CustomerQuickSearchResponse(long Id, string Name, string DocumentNumber);

public interface ICustomerService
{
    Task<CustomerSummaryResponse> CreateAsync(CustomerCreateRequest request, CancellationToken ct = default);
    Task<CustomerResponse> GetAsync(long id, CancellationToken ct = default);
    Task<PaginatedResponse<CustomerSummaryResponse>> ListAsync(int page, int size, bool? active, string? query, CancellationToken ct = default);
    Task<List<CustomerQuickSearchResponse>> QuickSearchAsync(string? query, CancellationToken ct = default);
    Task<CustomerSummaryResponse> UpdateAsync(CustomerUpdateRequest request, CancellationToken ct = default);
    Task SetActiveAsync(long id, bool active, CancellationToken ct = default);
    Task<CustomerSummaryResponse> RestoreAsync(long id, CancellationToken ct = default);
    Task HardDeleteAsync(long id, CancellationToken ct = default);
    Task<List<DocumentTypeResponse>> GetDocumentTypesAsync(CancellationToken ct = default);
}

public sealed class CustomerService : ICustomerService
{
    private readonly TenantDbContext _db;

    public CustomerService(TenantDbContext db) => _db = db;

    private async Task<Customer> RequireAsync(long id, CancellationToken ct) =>
        await _db.Customers.Include(c => c.DocumentType).FirstOrDefaultAsync(c => c.Id == id, ct)
        ?? throw new NotFoundException("Cliente no encontrado");

    private async Task<DocumentType> RequireDocumentTypeAsync(long? id, CancellationToken ct) =>
        await _db.DocumentTypes.FirstOrDefaultAsync(d => d.Id == id, ct)
        ?? throw new NotFoundException("Tipo de documento no encontrado");

    private static CustomerSummaryResponse Summary(Customer c) =>
        new(c.Id, c.Name, c.DocumentNumber, c.DocumentType.Name, c.PhoneNumber, c.Email, c.IsActive);

    public async Task<CustomerSummaryResponse> CreateAsync(CustomerCreateRequest request, CancellationToken ct = default)
    {
        if (await _db.Customers.AnyAsync(c => c.DocumentNumber == request.DocumentNumber, ct))
            throw new BadRequestException("El número de documento ya está en uso");
        DocumentType documentType = await RequireDocumentTypeAsync(request.DocumentTypeId, ct);
        var customer = new Customer
        {
            Name = request.Name!,
            DocumentType = documentType,
            DocumentNumber = request.DocumentNumber!,
            PhoneNumber = request.PhoneNumber,
            Email = request.Email,
            Address = request.Address,
            IsActive = true,
        };
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync(ct);
        return Summary(customer);
    }

    public async Task<CustomerResponse> GetAsync(long id, CancellationToken ct = default) =>
        CustomerResponse.From(await RequireAsync(id, ct));

    public async Task<PaginatedResponse<CustomerSummaryResponse>> ListAsync(int page, int size, bool? active, string? query,
        CancellationToken ct = default)
    {
        IQueryable<Customer> customers = _db.Customers.AsNoTracking();
        if (active is not null) customers = customers.Where(c => c.IsActive == active);
        if (!string.IsNullOrWhiteSpace(query))
        {
            string like = $"%{query.Trim()}%";
            customers = customers.Where(c =>
                EF.Functions.ILike(c.Name, like) || EF.Functions.ILike(c.DocumentNumber, like) ||
                EF.Functions.ILike(c.PhoneNumber!, like) || EF.Functions.ILike(c.Email!, like));
        }
        return await customers.OrderBy(c => c.Name).ThenBy(c => c.Id)
            .Select(c => new CustomerSummaryResponse(c.Id, c.Name, c.DocumentNumber, c.DocumentType.Name,
                c.PhoneNumber, c.Email, c.IsActive))
            .ToPageAsync(page, size, ct);
    }

    public async Task<List<CustomerQuickSearchResponse>> QuickSearchAsync(string? query, CancellationToken ct = default)
    {
        IQueryable<Customer> customers = _db.Customers.AsNoTracking().Where(c => c.IsActive);
        if (!string.IsNullOrWhiteSpace(query))
        {
            string like = $"%{query.Trim()}%";
            customers = customers.Where(c => EF.Functions.ILike(c.Name, like) || EF.Functions.ILike(c.DocumentNumber, like));
        }
        return await customers.OrderBy(c => c.Name).Take(10)
            .Select(c => new CustomerQuickSearchResponse(c.Id, c.Name, c.DocumentNumber)).ToListAsync(ct);
    }

    public async Task<CustomerSummaryResponse> UpdateAsync(CustomerUpdateRequest request, CancellationToken ct = default)
    {
        Customer customer = await RequireAsync(request.Id!.Value, ct);
        DocumentType documentType = await RequireDocumentTypeAsync(request.DocumentTypeId, ct);
        if (await _db.Customers.AnyAsync(c => c.DocumentNumber == request.DocumentNumber && c.Id != customer.Id, ct))
            throw new BadRequestException("El número de documento ya está en uso por otro cliente");
        customer.Name = request.Name!;
        customer.DocumentType = documentType;
        customer.DocumentNumber = request.DocumentNumber!;
        customer.PhoneNumber = request.PhoneNumber;
        customer.Email = request.Email;
        customer.Address = request.Address;
        await _db.SaveChangesAsync(ct);
        return Summary(customer);
    }

    public async Task SetActiveAsync(long id, bool active, CancellationToken ct = default)
    {
        Customer customer = await RequireAsync(id, ct);
        customer.IsActive = active;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<CustomerSummaryResponse> RestoreAsync(long id, CancellationToken ct = default)
    {
        Customer customer = await RequireAsync(id, ct);
        customer.IsActive = true;
        await _db.SaveChangesAsync(ct);
        return Summary(customer);
    }

    public async Task HardDeleteAsync(long id, CancellationToken ct = default)
    {
        Customer customer = await RequireAsync(id, ct);
        _db.Customers.Remove(customer);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<DocumentTypeResponse>> GetDocumentTypesAsync(CancellationToken ct = default) =>
        await _db.DocumentTypes.AsNoTracking().OrderBy(d => d.Id)
            .Select(d => new DocumentTypeResponse(d.Id, d.Name, d.Abbreviation)).ToListAsync(ct);
}

/// <summary>Tipos de documento de identidad con los que arranca toda empresa.</summary>
public sealed class CustomerTenantSeeder : ITenantSeeder
{
    private static readonly (string Name, string Abbreviation)[] Defaults =
    {
        ("Documento Nacional de Identidad", "DNI"),
        ("Registro Único de Contribuyentes", "RUC"),
        ("Carné de Extranjería", "CE"),
    };

    public int Order => 10;

    public async Task SeedAsync(TenantDbContext db, NewTenant? newTenant, CancellationToken ct)
    {
        List<string> existing = await db.DocumentTypes.Select(d => d.Name).ToListAsync(ct);
        foreach ((string name, string abbreviation) in Defaults.Where(d => !existing.Contains(d.Name)))
            db.DocumentTypes.Add(new DocumentType { Name = name, Abbreviation = abbreviation });
        await db.SaveChangesAsync(ct);
    }
}
