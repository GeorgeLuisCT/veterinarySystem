using VetSaas.Modules.Catalogs;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VetSaas.Modules.Finance.Domain;
using VetSaas.Modules.Inventory.Application;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;
using VetSaas.Shared.Infrastructure.Validation;

namespace VetSaas.Modules.Finance.Domain
{
    public enum AccountMovementType { CASHBOX_CLOSING, SUPPLIER_PAYMENT, EXPENSE, TRANSFER, MANUAL_ENTRY }

    public enum AccountPayableStatus { PENDING, PARTIALLY_PAID, PAID }


    /// <summary>Cuenta de tesorería (banco, caja fuerte, billetera). Su saldo es la suma de sus movimientos.</summary>
    [Table("treasury_accounts")]
    public class TreasuryAccount
    {
        public long Id { get; set; }
        [MaxLength(120)] public string Name { get; set; } = null!;
        [Catalog(CatalogKeys.TreasuryAccountType)] [MaxLength(60)] public string Type { get; set; }
        [MaxLength(500)] public string? Description { get; set; }
        public bool Active { get; set; } = true;
    }

    [Table("treasury_account_movements")]
    public class AccountMovement
    {
        public long Id { get; set; }
        public long TreasuryAccountId { get; set; }
        public TreasuryAccount TreasuryAccount { get; set; } = null!;
        public DateTime MovementDate { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal Amount { get; set; }
        [MaxLength(300)] public string? Description { get; set; }
        [MaxLength(30)] public AccountMovementType MovementType { get; set; }
        [MaxLength(100)] public string? Reference { get; set; }
    }

    [Table("accounts_payable")]
    public class AccountPayable
    {
        public long Id { get; set; }
        public long? SupplierId { get; set; }
        public Supplier? Supplier { get; set; }
        [MaxLength(250)] public string Description { get; set; } = null!;
        [Column("issue_date")] public DateTime IssueDateTime { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal TotalAmount { get; set; }
        [Column(TypeName = "numeric(14,2)")] public decimal AmountPaid { get; set; }
        [MaxLength(20)] public AccountPayableStatus Status { get; set; } = AccountPayableStatus.PENDING;
        public DateTime CreatedAt { get; set; }
        public List<AccountPayablePayment> Payments { get; set; } = new();
    }

    [Table("account_payable_payments")]
    public class AccountPayablePayment
    {
        public long Id { get; set; }
        public long AccountPayableId { get; set; }
        public AccountPayable AccountPayable { get; set; } = null!;
        public long TreasuryAccountId { get; set; }
        public TreasuryAccount TreasuryAccount { get; set; } = null!;
        [Column(TypeName = "numeric(14,2)")] public decimal Amount { get; set; }
        [Column("payment_date")] public DateTime PaymentDateTime { get; set; }
        [MaxLength(250)] public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

namespace VetSaas.Shared.Infrastructure.Persistence
{
    public partial class TenantDbContext
    {
        public DbSet<TreasuryAccount> TreasuryAccounts => Set<TreasuryAccount>();
        public DbSet<AccountMovement> AccountMovements => Set<AccountMovement>();
        public DbSet<AccountPayable> AccountsPayable => Set<AccountPayable>();
        public DbSet<AccountPayablePayment> AccountPayablePayments => Set<AccountPayablePayment>();
    }
}

namespace VetSaas.Modules.Finance
{
    public sealed class TreasuryAccountConfiguration : IEntityTypeConfiguration<TreasuryAccount>
    {
        public void Configure(EntityTypeBuilder<TreasuryAccount> builder) => builder.HasIndex(a => a.Name).IsUnique();
    }

    public sealed class AccountPayableConfiguration : IEntityTypeConfiguration<AccountPayable>
    {
        public void Configure(EntityTypeBuilder<AccountPayable> builder) =>
            builder.HasMany(a => a.Payments).WithOne(p => p.AccountPayable).HasForeignKey(p => p.AccountPayableId)
                .OnDelete(DeleteBehavior.Cascade);
    }

    // ---- DTOs ----

    public sealed record CreateAccountMovementRequest(decimal? Amount, string? Description, DateTime? MovementDate, bool? Income);
    public sealed record CreateAccountPayableRequest(long? SupplierId, string? Description, DateTime? IssueDateTime, decimal? TotalAmount);
    public sealed record CreateTreasuryAccountRequest(string? Name, string? Type, string? Description);
    public sealed record UpdateTreasuryAccountRequest(string? Name, string? Type, string? Description);
    public sealed record ExpenseRequest(long? TreasuryAccountId, string? Description, decimal? Amount, DateTime? OccurredAt);
    public sealed record RegisterPaymentRequest(decimal? Amount, long? TreasuryAccountId, DateTime? PaymentDateTime, string? Notes);
    public sealed record TransferRequest(long? SourceAccountId, long? TargetAccountId, string? Description, decimal? Amount, DateTime? OccurredAt);

    public sealed class CreateAccountMovementRequestValidator : AbstractValidator<CreateAccountMovementRequest>
    {
        public CreateAccountMovementRequestValidator() =>
            RuleFor(r => r.Amount).NotNull().WithMessage("El monto es obligatorio").GreaterThan(0).WithMessage("El monto debe ser mayor a 0");
    }

    public sealed class CreateAccountPayableRequestValidator : AbstractValidator<CreateAccountPayableRequest>
    {
        public CreateAccountPayableRequestValidator()
        {
            RuleFor(r => r.Description).NotEmpty().WithMessage("La descripción es obligatoria");
            RuleFor(r => r.IssueDateTime).NotNull().WithMessage("La fecha de emisión es obligatoria");
            RuleFor(r => r.TotalAmount).NotNull().WithMessage("El monto total es obligatorio")
                .GreaterThan(0).WithMessage("El monto total debe ser mayor a 0");
        }
    }

    public sealed class CreateTreasuryAccountRequestValidator : AbstractValidator<CreateTreasuryAccountRequest>
    {
        public CreateTreasuryAccountRequestValidator()
        {
            RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre de la cuenta es obligatorio");
            RuleFor(r => r.Type).NotNull().WithMessage("El tipo de cuenta es obligatorio");
        }
    }

    public sealed class UpdateTreasuryAccountRequestValidator : AbstractValidator<UpdateTreasuryAccountRequest>
    {
        public UpdateTreasuryAccountRequestValidator()
        {
            RuleFor(r => r.Name).NotEmpty().WithMessage("El nombre de la cuenta es obligatorio");
            RuleFor(r => r.Type).NotNull().WithMessage("El tipo de cuenta es obligatorio");
        }
    }

    public sealed class ExpenseRequestValidator : AbstractValidator<ExpenseRequest>
    {
        public ExpenseRequestValidator()
        {
            RuleFor(r => r.TreasuryAccountId).NotNull().WithMessage("La cuenta es obligatoria");
            RuleFor(r => r.Description).NotEmpty().WithMessage("La descripción es obligatoria");
            RuleFor(r => r.Amount).NotNull().WithMessage("El monto es obligatorio").GreaterThan(0).WithMessage("El monto debe ser mayor a 0");
        }
    }

    public sealed class RegisterPaymentRequestValidator : AbstractValidator<RegisterPaymentRequest>
    {
        public RegisterPaymentRequestValidator()
        {
            RuleFor(r => r.Amount).NotNull().WithMessage("El monto es obligatorio").GreaterThan(0).WithMessage("El monto debe ser mayor a 0");
            RuleFor(r => r.TreasuryAccountId).NotNull().WithMessage("Debe seleccionar una cuenta de tesorería");
        }
    }

    public sealed class TransferRequestValidator : AbstractValidator<TransferRequest>
    {
        public TransferRequestValidator()
        {
            RuleFor(r => r.SourceAccountId).NotNull().WithMessage("La cuenta de origen es obligatoria");
            RuleFor(r => r.TargetAccountId).NotNull().WithMessage("La cuenta de destino es obligatoria");
            RuleFor(r => r.Amount).NotNull().WithMessage("El monto es obligatorio").GreaterThan(0).WithMessage("El monto debe ser mayor a 0");
        }
    }

    public sealed record AccountMovementResponse(long Id, long TreasuryAccountId, string? TreasuryAccountName, DateTime MovementDate,
        decimal Amount, string? Description, AccountMovementType MovementType, string? Reference)
    {
        public static AccountMovementResponse From(AccountMovement m) => new(m.Id, m.TreasuryAccountId, m.TreasuryAccount?.Name,
            m.MovementDate, m.Amount, m.Description, m.MovementType, m.Reference);
    }

    public sealed record AccountPayablePaymentResponse(long Id, decimal Amount, DateTime PaymentDateTime, long TreasuryAccountId,
        string? TreasuryAccountName, string? Notes);

    public sealed record AccountPayableSummaryResponse(long Id, long? SupplierId, string? SupplierName, string Description,
        DateTime IssueDateTime, decimal TotalAmount, decimal AmountPaid, AccountPayableStatus Status)
    {
        public static AccountPayableSummaryResponse From(AccountPayable a) => new(a.Id, a.SupplierId, a.Supplier?.Name,
            a.Description, a.IssueDateTime, a.TotalAmount, a.AmountPaid, a.Status);
    }

    public sealed record AccountPayableDetailResponse(long Id, long? SupplierId, string? SupplierName, string Description,
        DateTime IssueDateTime, decimal TotalAmount, decimal AmountPaid, AccountPayableStatus Status,
        IReadOnlyList<AccountPayablePaymentResponse> Payments);

    public sealed record TransferResponse(AccountMovementResponse SourceMovement, AccountMovementResponse DestinationMovement);

    public sealed record TreasuryAccountResponse(long Id, string Name, string Type, string? Description, bool Active,
        decimal CurrentBalance);

    // ---- Servicios ----

    internal static class Money
    {
        public static decimal Round(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);
    }

    public interface IAccountMovementService
    {
        /// <summary>Movimiento en una cuenta (positivo entra, negativo sale); un retiro no puede dejar la cuenta en negativo.</summary>
        Task<AccountMovement> RegisterMovementAsync(long treasuryAccountId, decimal amount, AccountMovementType type,
            string? description, DateTime? movementDate, string? reference, CancellationToken ct = default);
        Task<decimal> GetCurrentBalanceAsync(long treasuryAccountId, CancellationToken ct = default);
    }

    public sealed class AccountMovementService : IAccountMovementService
    {
        private readonly TenantDbContext _db;
        private readonly IClock _clock;

        public AccountMovementService(TenantDbContext db, IClock clock)
        {
            _db = db;
            _clock = clock;
        }

        public Task<AccountMovement> RegisterMovementAsync(long treasuryAccountId, decimal amount, AccountMovementType type,
            string? description, DateTime? movementDate, string? reference, CancellationToken ct = default) =>
            _db.InTransactionAsync(async () =>
            {
                if (amount == 0) throw new BadRequestException("El monto del movimiento debe ser distinto de cero");
                // Bloquea la cuenta: dos retiros simultáneos no pueden dejarla en negativo.
                TreasuryAccount account = (await _db.TreasuryAccounts
                                              .FromSqlInterpolated($"SELECT * FROM treasury_accounts WHERE id = {treasuryAccountId} FOR UPDATE")
                                              .ToListAsync(ct)).FirstOrDefault()
                                          ?? throw new NotFoundException("Cuenta de tesorería no encontrada");
                if (!account.Active)
                    throw new BadRequestException($"La cuenta de tesorería '{account.Name}' está inactiva");

                decimal normalized = Money.Round(amount);
                if (normalized < 0)
                {
                    decimal balance = await GetCurrentBalanceAsync(treasuryAccountId, ct);
                    if (balance + normalized < 0)
                        throw new BadRequestException($"Saldo insuficiente en '{account.Name}': disponible {balance:0.00}, se intenta retirar {Math.Abs(normalized):0.00}");
                }
                var movement = new AccountMovement
                {
                    TreasuryAccount = account,
                    MovementType = type,
                    Description = description,
                    MovementDate = movementDate ?? _clock.Now,
                    Reference = reference,
                    Amount = normalized,
                };
                _db.AccountMovements.Add(movement);
                await _db.SaveChangesAsync(ct);
                return movement;
            }, ct);

        public async Task<decimal> GetCurrentBalanceAsync(long treasuryAccountId, CancellationToken ct = default) =>
            Money.Round(await _db.AccountMovements.Where(m => m.TreasuryAccountId == treasuryAccountId)
                .SumAsync(m => (decimal?)m.Amount, ct) ?? 0m);
    }

    public interface IAccountPayableService : IPurchasePayableRegistrar
    {
        Task<PaginatedResponse<AccountPayableSummaryResponse>> ListAsync(string? search, AccountPayableStatus? status, long? supplierId,
            int page, int size, CancellationToken ct = default);
        Task<AccountPayableDetailResponse> GetDetailAsync(long id, CancellationToken ct = default);
        Task<AccountPayableSummaryResponse> CreateAsync(CreateAccountPayableRequest request, CancellationToken ct = default);
        Task<AccountPayableDetailResponse> RegisterPaymentAsync(long id, RegisterPaymentRequest request, CancellationToken ct = default);
    }

    public sealed class AccountPayableService : IAccountPayableService
    {
        private readonly TenantDbContext _db;
        private readonly IAccountMovementService _movements;
        private readonly IClock _clock;

        public AccountPayableService(TenantDbContext db, IAccountMovementService movements, IClock clock)
        {
            _db = db;
            _movements = movements;
            _clock = clock;
        }

        public async Task<PaginatedResponse<AccountPayableSummaryResponse>> ListAsync(string? search, AccountPayableStatus? status,
            long? supplierId, int page, int size, CancellationToken ct = default)
        {
            IQueryable<AccountPayable> query = _db.AccountsPayable.AsNoTracking();
            if (status is not null) query = query.Where(a => a.Status == status);
            if (supplierId is not null) query = query.Where(a => a.SupplierId == supplierId);
            if (!string.IsNullOrWhiteSpace(search))
            {
                string like = $"%{search.Trim()}%";
                query = query.Where(a => EF.Functions.ILike(a.Description, like) ||
                                         (a.Supplier != null && EF.Functions.ILike(a.Supplier.Name, like)));
            }
            return await query.OrderBy(a => a.Id)
                .Select(a => new AccountPayableSummaryResponse(a.Id, a.SupplierId, a.Supplier != null ? a.Supplier.Name : null,
                    a.Description, a.IssueDateTime, a.TotalAmount, a.AmountPaid, a.Status))
                .ToPageAsync(page, size, ct);
        }

        public async Task<AccountPayableDetailResponse> GetDetailAsync(long id, CancellationToken ct = default)
        {
            AccountPayable payable = await _db.AccountsPayable.AsNoTracking()
                                         .Include(a => a.Supplier)
                                         .Include(a => a.Payments).ThenInclude(p => p.TreasuryAccount)
                                         .FirstOrDefaultAsync(a => a.Id == id, ct)
                                     ?? throw new NotFoundException("Cuenta por pagar no encontrada");
            return ToDetail(payable);
        }

        private static AccountPayableDetailResponse ToDetail(AccountPayable a) => new(a.Id, a.SupplierId, a.Supplier?.Name,
            a.Description, a.IssueDateTime, a.TotalAmount, a.AmountPaid, a.Status,
            a.Payments.OrderByDescending(p => p.PaymentDateTime)
                .Select(p => new AccountPayablePaymentResponse(p.Id, p.Amount, p.PaymentDateTime, p.TreasuryAccountId,
                    p.TreasuryAccount?.Name, p.Notes)).ToList());

        public async Task<AccountPayableSummaryResponse> CreateAsync(CreateAccountPayableRequest request, CancellationToken ct = default)
        {
            AccountPayable payable = await NewPayableAsync(request.SupplierId, request.Description!.Trim(),
                request.IssueDateTime!.Value, request.TotalAmount!.Value, ct);
            await _db.SaveChangesAsync(ct);
            return AccountPayableSummaryResponse.From(payable);
        }

        private async Task<AccountPayable> NewPayableAsync(long? supplierId, string description, DateTime issueDate,
            decimal total, CancellationToken ct)
        {
            if (total <= 0) throw new BadRequestException("El monto total de la cuenta por pagar debe ser mayor a cero");
            Supplier? supplier = supplierId is null
                ? null
                : await _db.Suppliers.FirstOrDefaultAsync(s => s.Id == supplierId, ct) ?? throw new NotFoundException("Proveedor no encontrado");
            var payable = new AccountPayable
            {
                Supplier = supplier,
                Description = description,
                IssueDateTime = issueDate,
                TotalAmount = Money.Round(total),
                AmountPaid = 0m,
                Status = AccountPayableStatus.PENDING,
                CreatedAt = _clock.Now,
            };
            _db.AccountsPayable.Add(payable);
            return payable;
        }

        public Task<AccountPayableDetailResponse> RegisterPaymentAsync(long id, RegisterPaymentRequest request,
            CancellationToken ct = default) =>
            _db.InTransactionAsync(async () =>
            {
                if (request.TreasuryAccountId is null) throw new BadRequestException("Debe seleccionar una cuenta de tesorería");
                AccountPayable payable = (await _db.AccountsPayable
                                             .FromSqlInterpolated($"SELECT * FROM accounts_payable WHERE id = {id} FOR UPDATE")
                                             .ToListAsync(ct)).FirstOrDefault()
                                         ?? throw new NotFoundException("Cuenta por pagar no encontrada");
                TreasuryAccount account = await _db.TreasuryAccounts.FirstOrDefaultAsync(t => t.Id == request.TreasuryAccountId, ct)
                    ?? throw new NotFoundException("Cuenta de tesorería no encontrada");

                decimal amount = Money.Round(request.Amount!.Value);
                if (amount <= 0) throw new BadRequestException("El monto debe ser mayor a cero");
                if (payable.Status == AccountPayableStatus.PAID)
                    throw new BadRequestException("La cuenta por pagar ya está pagada en su totalidad");
                decimal outstanding = Money.Round(payable.TotalAmount - payable.AmountPaid);
                if (amount > outstanding)
                    throw new BadRequestException($"El pago ({amount:0.00}) excede el saldo pendiente ({outstanding:0.00})");

                var payment = new AccountPayablePayment
                {
                    AccountPayableId = payable.Id,
                    TreasuryAccount = account,
                    Amount = amount,
                    PaymentDateTime = request.PaymentDateTime ?? _clock.Now,
                    Notes = request.Notes,
                    CreatedAt = _clock.Now,
                };
                _db.AccountPayablePayments.Add(payment);
                await _movements.RegisterMovementAsync(account.Id, -amount, AccountMovementType.SUPPLIER_PAYMENT,
                    "Pago de cuenta por pagar #" + payable.Id, payment.PaymentDateTime, null, ct);

                payable.AmountPaid = Money.Round(payable.AmountPaid + amount);
                if (payable.AmountPaid >= payable.TotalAmount)
                {
                    payable.AmountPaid = payable.TotalAmount;
                    payable.Status = AccountPayableStatus.PAID;
                }
                else payable.Status = payable.AmountPaid > 0 ? AccountPayableStatus.PARTIALLY_PAID : AccountPayableStatus.PENDING;
                await _db.SaveChangesAsync(ct);
                return await GetDetailAsync(payable.Id, ct);
            }, ct);

        public Task RegisterPurchasePayableAsync(long supplierId, string description, DateTime issueDate, decimal totalAmount,
            decimal? upfrontPayment, long? treasuryAccountId, string paymentDescription, CancellationToken ct = default) =>
            _db.InTransactionAsync(async () =>
            {
                AccountPayable payable = await NewPayableAsync(supplierId, description, issueDate, totalAmount, ct);
                await _db.SaveChangesAsync(ct);
                if (upfrontPayment is > 0 && treasuryAccountId is not null)
                    await RegisterPaymentAsync(payable.Id,
                        new RegisterPaymentRequest(upfrontPayment, treasuryAccountId, issueDate, paymentDescription), ct);
            }, ct);
    }

    public interface ITreasuryService
    {
        Task<List<TreasuryAccountResponse>> ListActiveAsync(CancellationToken ct = default);
        Task<TreasuryAccountResponse> GetAsync(long id, CancellationToken ct = default);
        Task<TreasuryAccountResponse> CreateAsync(CreateTreasuryAccountRequest request, CancellationToken ct = default);
        Task<TreasuryAccountResponse> UpdateAsync(long id, UpdateTreasuryAccountRequest request, CancellationToken ct = default);
        Task DeleteAsync(long id, CancellationToken ct = default);
        Task<PaginatedResponse<AccountMovementResponse>> ListMovementsAsync(long id, int page, int size, CancellationToken ct = default);
        Task<AccountMovementResponse> RegisterManualMovementAsync(long id, CreateAccountMovementRequest request, CancellationToken ct = default);
        Task<AccountMovementResponse> RegisterExpenseAsync(ExpenseRequest request, CancellationToken ct = default);
        Task<TransferResponse> RegisterTransferAsync(TransferRequest request, CancellationToken ct = default);
    }

    public sealed class TreasuryService : ITreasuryService
    {
        private readonly TenantDbContext _db;
        private readonly IAccountMovementService _movements;

        public TreasuryService(TenantDbContext db, IAccountMovementService movements)
        {
            _db = db;
            _movements = movements;
        }

        private async Task<TreasuryAccountResponse> ToResponseAsync(TreasuryAccount a, CancellationToken ct) =>
            new(a.Id, a.Name, a.Type, a.Description, a.Active, await _movements.GetCurrentBalanceAsync(a.Id, ct));

        private async Task<TreasuryAccount> RequireAsync(long id, CancellationToken ct) =>
            await _db.TreasuryAccounts.FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new NotFoundException("Cuenta de tesorería no encontrada");

        public async Task<List<TreasuryAccountResponse>> ListActiveAsync(CancellationToken ct = default)
        {
            var accounts = await _db.TreasuryAccounts.AsNoTracking().Where(a => a.Active).OrderBy(a => a.Name).ToListAsync(ct);
            var balances = await _db.AccountMovements.GroupBy(m => m.TreasuryAccountId)
                .Select(g => new { g.Key, Total = g.Sum(m => m.Amount) }).ToDictionaryAsync(x => x.Key, x => x.Total, ct);
            return accounts.Select(a => new TreasuryAccountResponse(a.Id, a.Name, a.Type, a.Description, a.Active,
                Money.Round(balances.GetValueOrDefault(a.Id)))).ToList();
        }

        public async Task<TreasuryAccountResponse> GetAsync(long id, CancellationToken ct = default) =>
            await ToResponseAsync(await RequireAsync(id, ct), ct);

        private async Task EnsureUniqueNameAsync(string? name, long? excludeId, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(name)) throw new BadRequestException("El nombre de la cuenta es obligatorio");
            string normalized = name.Trim().ToLower();
            if (await _db.TreasuryAccounts.AnyAsync(a => a.Name.ToLower() == normalized && a.Id != excludeId, ct))
                throw new BadRequestException("Ya existe una cuenta de tesorería con el mismo nombre");
        }

        public async Task<TreasuryAccountResponse> CreateAsync(CreateTreasuryAccountRequest request, CancellationToken ct = default)
        {
            await EnsureUniqueNameAsync(request.Name, null, ct);
            var account = new TreasuryAccount
            {
                Name = request.Name!.Trim(), Description = request.Description, Type = request.Type!, Active = true,
            };
            _db.TreasuryAccounts.Add(account);
            await _db.SaveChangesAsync(ct);
            return new TreasuryAccountResponse(account.Id, account.Name, account.Type, account.Description, true, 0m);
        }

        public async Task<TreasuryAccountResponse> UpdateAsync(long id, UpdateTreasuryAccountRequest request, CancellationToken ct = default)
        {
            TreasuryAccount account = await RequireAsync(id, ct);
            await EnsureUniqueNameAsync(request.Name, id, ct);
            account.Name = request.Name!.Trim();
            account.Description = request.Description;
            account.Type = request.Type!;
            await _db.SaveChangesAsync(ct);
            return await ToResponseAsync(account, ct);
        }

        public async Task DeleteAsync(long id, CancellationToken ct = default)
        {
            TreasuryAccount account = await RequireAsync(id, ct);
            if (await _db.AccountMovements.AnyAsync(m => m.TreasuryAccountId == id, ct))
                throw new BadRequestException("No se puede eliminar la cuenta porque tiene movimientos asociados");
            _db.TreasuryAccounts.Remove(account);
            await _db.SaveChangesAsync(ct);
        }

        public async Task<PaginatedResponse<AccountMovementResponse>> ListMovementsAsync(long id, int page, int size,
            CancellationToken ct = default)
        {
            if (!await _db.TreasuryAccounts.AnyAsync(a => a.Id == id, ct))
                throw new NotFoundException("Cuenta de tesorería no encontrada");
            return await _db.AccountMovements.AsNoTracking().Where(m => m.TreasuryAccountId == id)
                .OrderByDescending(m => m.MovementDate).ThenByDescending(m => m.Id)
                .Select(m => new AccountMovementResponse(m.Id, m.TreasuryAccountId, m.TreasuryAccount.Name, m.MovementDate,
                    m.Amount, m.Description, m.MovementType, m.Reference))
                .ToPageAsync(page, size, ct);
        }

        public async Task<AccountMovementResponse> RegisterManualMovementAsync(long id, CreateAccountMovementRequest request,
            CancellationToken ct = default)
        {
            decimal amount = request.Income == false ? -request.Amount!.Value : request.Amount!.Value;
            return AccountMovementResponse.From(await _movements.RegisterMovementAsync(id, amount,
                AccountMovementType.MANUAL_ENTRY, request.Description, request.MovementDate, null, ct));
        }

        public async Task<AccountMovementResponse> RegisterExpenseAsync(ExpenseRequest request, CancellationToken ct = default)
        {
            if (request.Amount <= 0) throw new BadRequestException("El monto del gasto debe ser mayor a cero");
            return AccountMovementResponse.From(await _movements.RegisterMovementAsync(request.TreasuryAccountId!.Value,
                -request.Amount!.Value, AccountMovementType.EXPENSE, request.Description, request.OccurredAt, null, ct));
        }

        public Task<TransferResponse> RegisterTransferAsync(TransferRequest request, CancellationToken ct = default) =>
            _db.InTransactionAsync(async () =>
            {
                if (request.SourceAccountId == request.TargetAccountId)
                    throw new BadRequestException("Las cuentas origen y destino deben ser diferentes");
                if (request.Amount <= 0) throw new BadRequestException("El monto de la transferencia debe ser mayor a cero");
                string? description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description;
                AccountMovement source = await _movements.RegisterMovementAsync(request.SourceAccountId!.Value, -request.Amount!.Value,
                    AccountMovementType.TRANSFER, description ?? "Transferencia saliente", request.OccurredAt, null, ct);
                AccountMovement target = await _movements.RegisterMovementAsync(request.TargetAccountId!.Value, request.Amount!.Value,
                    AccountMovementType.TRANSFER, description ?? "Transferencia entrante", request.OccurredAt, null, ct);
                return new TransferResponse(AccountMovementResponse.From(source), AccountMovementResponse.From(target));
            }, ct);
    }

    public static class FinanceEndpoints
    {
        public static void MapFinanceEndpoints(this WebApplication app)
        {
            var payables = app.MapGroup("/api/accounts-payable").WithTags("Finance");

            payables.MapGet("/", async (IAccountPayableService s, CancellationToken ct, string? search = null,
                    AccountPayableStatus? status = null, long? supplierId = null, int page = 0, int size = 20) =>
                Results.Ok(await s.ListAsync(search, status, supplierId, page, size, ct)));

            payables.MapGet("/{id:long}", async (long id, IAccountPayableService s, CancellationToken ct) =>
                Results.Ok(await s.GetDetailAsync(id, ct)));

            payables.MapPost("/", async (CreateAccountPayableRequest request, IAccountPayableService s, CancellationToken ct) =>
                Results.Ok(await s.CreateAsync(request, ct))).Validate<CreateAccountPayableRequest>();

            payables.MapPost("/{id:long}/payments", async (long id, RegisterPaymentRequest request, IAccountPayableService s,
                CancellationToken ct) => Results.Ok(await s.RegisterPaymentAsync(id, request, ct))).Validate<RegisterPaymentRequest>();

            app.MapPost("/api/finance/expenses", async (ExpenseRequest request, ITreasuryService s, CancellationToken ct) =>
                Results.Ok(await s.RegisterExpenseAsync(request, ct))).WithTags("Finance").Validate<ExpenseRequest>();

            app.MapPost("/api/finance/transfers", async (TransferRequest request, ITreasuryService s, CancellationToken ct) =>
                Results.Ok(await s.RegisterTransferAsync(request, ct))).WithTags("Finance").Validate<TransferRequest>();

            var accounts = app.MapGroup("/api/treasury-accounts").WithTags("Finance");

            accounts.MapGet("/", async (ITreasuryService s, CancellationToken ct) => Results.Ok(await s.ListActiveAsync(ct)));

            accounts.MapGet("/{id:long}", async (long id, ITreasuryService s, CancellationToken ct) => Results.Ok(await s.GetAsync(id, ct)));

            accounts.MapPost("/", async (CreateTreasuryAccountRequest request, ITreasuryService s, CancellationToken ct) =>
                Results.Ok(await s.CreateAsync(request, ct))).Validate<CreateTreasuryAccountRequest>();

            accounts.MapPut("/{id:long}", async (long id, UpdateTreasuryAccountRequest request, ITreasuryService s, CancellationToken ct) =>
                Results.Ok(await s.UpdateAsync(id, request, ct))).Validate<UpdateTreasuryAccountRequest>();

            accounts.MapDelete("/{id:long}", async (long id, ITreasuryService s, CancellationToken ct) =>
            {
                await s.DeleteAsync(id, ct);
                return Results.NoContent();
            });

            accounts.MapGet("/{id:long}/movements", async (long id, ITreasuryService s, CancellationToken ct, int page = 0, int size = 20) =>
                Results.Ok(await s.ListMovementsAsync(id, page, size, ct)));

            accounts.MapPost("/{id:long}/movements", async (long id, CreateAccountMovementRequest request, ITreasuryService s,
                CancellationToken ct) => Results.Ok(await s.RegisterManualMovementAsync(id, request, ct)))
                .Validate<CreateAccountMovementRequest>();
        }
    }
}
