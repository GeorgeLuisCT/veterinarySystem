using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Finance;
using VetSaas.Modules.Finance.Domain;
using VetSaas.Modules.Sales.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Sales.Application;

public sealed record OpenCashSessionRequest(long? BranchId, long? CashierId, decimal? OpeningAmount);

public sealed class OpenCashSessionRequestValidator : AbstractValidator<OpenCashSessionRequest>
{
    public OpenCashSessionRequestValidator()
    {
        RuleFor(r => r.BranchId).NotNull().WithMessage("La sucursal es obligatoria");
        RuleFor(r => r.CashierId).NotNull().WithMessage("El cajero es obligatorio");
        RuleFor(r => r.OpeningAmount).NotNull().WithMessage("El monto de apertura es obligatorio")
            .GreaterThanOrEqualTo(0).WithMessage("El monto de apertura no puede ser negativo");
    }
}

public sealed record RegisterCashMovementRequest(CashMovementType? MovementType, decimal? Amount, string? Reason, long? RegisteredById,
    string? Reference);

public sealed class RegisterCashMovementRequestValidator : AbstractValidator<RegisterCashMovementRequest>
{
    public RegisterCashMovementRequestValidator()
    {
        RuleFor(r => r.MovementType).NotNull().WithMessage("El tipo de movimiento es obligatorio");
        RuleFor(r => r.Amount).NotNull().WithMessage("El monto es obligatorio").GreaterThan(0).WithMessage("El monto debe ser mayor a 0");
        RuleFor(r => r.Reason).NotEmpty().WithMessage("El motivo es obligatorio");
        RuleFor(r => r.RegisteredById).NotNull().WithMessage("El usuario que registra es obligatorio");
    }
}

public sealed record PaymentTransferAllocation(PaymentMethod? PaymentMethod, long? TreasuryAccountId);

public sealed record CloseCashSessionRequest(decimal? CountedClosingAmount, string? Notes, List<PaymentTransferAllocation>? PaymentTransfers);

public sealed class CloseCashSessionRequestValidator : AbstractValidator<CloseCashSessionRequest>
{
    public CloseCashSessionRequestValidator()
    {
        RuleFor(r => r.CountedClosingAmount).NotNull().WithMessage("El monto contado es obligatorio")
            .GreaterThanOrEqualTo(0).WithMessage("El monto contado no puede ser negativo");
        RuleForEach(r => r.PaymentTransfers).ChildRules(t =>
            t.RuleFor(x => x.PaymentMethod).NotNull().WithMessage("El método de pago es obligatorio"));
    }
}

public sealed record CashboxPaymentBreakdownResponse(PaymentMethod PaymentMethod, string Label, decimal Amount);

public sealed record CashMovementResponse(long Id, CashMovementType MovementType, decimal Amount, string Reason, long RegisteredById,
    string? RegisteredByName, DateTime RegisteredAt, string? Reference);

public sealed record CashSessionSummaryResponse(long Id, long BranchId, string? BranchName, long CashierId, string? CashierName,
    CashSessionStatus Status, DateTime OpenedAt, DateTime? ClosedAt, decimal OpeningAmount, decimal TotalSales, decimal TotalCashSales,
    decimal TotalIncomeMovements, decimal TotalExpenseMovements, decimal CalculatedClosingAmount, decimal? CountedClosingAmount,
    decimal? DifferenceAmount, string? Notes);

public sealed record CashSessionSalePaymentResponse(long PaymentId, long SaleId, DateTime PaidAt, PaymentMethod PaymentMethod,
    decimal AmountPaid, string CustomerName, string SaleDocumentNumber, decimal SaleGrandTotal);

public sealed record CashSessionDetailResponse(bool Open, CashSessionSummaryResponse? Session,
    IReadOnlyList<CashMovementResponse> Movements, IReadOnlyList<CashboxPaymentBreakdownResponse> PaymentBreakdown,
    IReadOnlyList<CashSessionSalePaymentResponse> SalePayments);

public sealed record CashSessionHistoryResponse(long Id, long BranchId, string? BranchName, long CashierId, string? CashierName,
    DateTime OpenedAt, DateTime? ClosedAt, decimal OpeningAmount, decimal CalculatedClosingAmount, decimal? CountedClosingAmount,
    decimal? DifferenceAmount, string? Notes);

public interface ICashSessionService
{
    Task<CashSessionSummaryResponse> OpenAsync(OpenCashSessionRequest request, CancellationToken ct = default);
    Task<CashSessionDetailResponse> GetActiveAsync(long branchId, CancellationToken ct = default);
    Task<CashSessionDetailResponse> GetDetailAsync(long id, CancellationToken ct = default);
    Task<CashSessionDetailResponse> RegisterMovementAsync(long id, RegisterCashMovementRequest request, CancellationToken ct = default);
    Task<CashSessionSummaryResponse> CloseAsync(long id, CloseCashSessionRequest request, CancellationToken ct = default);
    Task<PaginatedResponse<CashSessionHistoryResponse>> HistoryAsync(long? branchId, long? cashierId, DateTime? startDate,
        DateTime? endDate, int page, int size, CancellationToken ct = default);
}

public sealed class CashSessionService : ICashSessionService
{
    private readonly TenantDbContext _db;
    private readonly IAccountMovementService _accountMovements;
    private readonly IClock _clock;

    public CashSessionService(TenantDbContext db, IAccountMovementService accountMovements, IClock clock)
    {
        _db = db;
        _accountMovements = accountMovements;
        _clock = clock;
    }

    private static decimal Money(decimal value) => Math.Round(value, 2, MidpointRounding.AwayFromZero);

    private IQueryable<CashSession> WithNames() => _db.CashSessions
        .Include(s => s.Branch).Include(s => s.Cashier).ThenInclude(u => u.Employee);

    /// <summary>Bloquea la fila de la caja hasta el fin de la transacción (registrar movimiento o cerrar, uno a la vez).</summary>
    private async Task<CashSession> LockAsync(long id, CancellationToken ct)
    {
        CashSession? session = (await _db.CashSessions.FromSqlInterpolated($"SELECT * FROM cash_sessions WHERE id = {id} FOR UPDATE")
            .ToListAsync(ct)).FirstOrDefault();
        if (session is null) throw new NotFoundException("Sesión de caja no encontrada");
        await _db.Entry(session).Reference(s => s.Branch).LoadAsync(ct);
        await _db.Entry(session).Reference(s => s.Cashier).LoadAsync(ct);
        await _db.Entry(session.Cashier).Reference(u => u.Employee).LoadAsync(ct);
        return session;
    }

    public Task<CashSessionSummaryResponse> OpenAsync(OpenCashSessionRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            // Bloquea la sucursal: dos aperturas simultáneas no pueden crear dos cajas abiertas.
            var branch = (await _db.Branches.FromSqlInterpolated($"SELECT * FROM branches WHERE id = {request.BranchId} FOR UPDATE")
                .ToListAsync(ct)).FirstOrDefault() ?? throw new NotFoundException("Sucursal no encontrada");
            if (request.OpeningAmount < 0) throw new BadRequestException("El monto de apertura no puede ser negativo");
            var cashier = await _db.Users.Include(u => u.Employee).FirstOrDefaultAsync(u => u.Id == request.CashierId, ct)
                ?? throw new NotFoundException("Usuario no encontrado");
            if (await _db.CashSessions.AnyAsync(s => s.BranchId == branch.Id && s.Status == CashSessionStatus.OPEN, ct))
                throw new BadRequestException("Ya existe una sesión de caja abierta para la sucursal");

            var session = new CashSession
            {
                Branch = branch,
                Cashier = cashier,
                OpeningAmount = Money(request.OpeningAmount!.Value),
                Status = CashSessionStatus.OPEN,
                OpenedAt = _clock.Now,
            };
            _db.CashSessions.Add(session);
            await _db.SaveChangesAsync(ct);
            return await SummaryAsync(session, ct);
        }, ct);

    public async Task<CashSessionDetailResponse> GetActiveAsync(long branchId, CancellationToken ct = default)
    {
        CashSession? session = await WithNames().AsNoTracking()
            .Where(s => s.BranchId == branchId && s.Status == CashSessionStatus.OPEN)
            .OrderByDescending(s => s.OpenedAt).FirstOrDefaultAsync(ct);
        return session is null
            ? new CashSessionDetailResponse(false, null, new List<CashMovementResponse>(),
                new List<CashboxPaymentBreakdownResponse>(), new List<CashSessionSalePaymentResponse>())
            : await DetailAsync(session, ct);
    }

    public async Task<CashSessionDetailResponse> GetDetailAsync(long id, CancellationToken ct = default) =>
        await DetailAsync(await WithNames().AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct)
                          ?? throw new NotFoundException("Sesión de caja no encontrada"), ct);

    public Task<CashSessionDetailResponse> RegisterMovementAsync(long id, RegisterCashMovementRequest request,
        CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            CashSession session = await LockAsync(id, ct);
            if (session.Status != CashSessionStatus.OPEN)
                throw new BadRequestException("Solo se pueden registrar movimientos en sesiones abiertas");
            if (request.Amount <= 0) throw new BadRequestException("El monto del movimiento debe ser mayor a cero");
            if (request.MovementType == CashMovementType.EXPENSE)
            {
                decimal available = (await SummaryAsync(session, ct)).CalculatedClosingAmount;
                if (request.Amount > available)
                    throw new BadRequestException($"El egreso ({Money(request.Amount!.Value):0.00}) supera el efectivo disponible en caja ({available:0.00})");
            }
            var registeredBy = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.RegisteredById, ct)
                ?? throw new NotFoundException("Usuario registrador no encontrado");
            _db.CashSessionMovements.Add(new CashSessionMovement
            {
                CashSessionId = session.Id,
                MovementType = request.MovementType!.Value,
                Amount = Money(request.Amount!.Value),
                Reason = request.Reason!,
                RegisteredBy = registeredBy,
                RegisteredAt = _clock.Now,
                Reference = request.Reference,
            });
            await _db.SaveChangesAsync(ct);
            return await DetailAsync(session, ct);
        }, ct);

    public Task<CashSessionSummaryResponse> CloseAsync(long id, CloseCashSessionRequest request, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            CashSession session = await LockAsync(id, ct);
            if (session.Status != CashSessionStatus.OPEN) throw new BadRequestException("La sesión ya se encuentra cerrada");
            if (request.CountedClosingAmount < 0) throw new BadRequestException("El monto contado no puede ser negativo");

            decimal counted = Money(request.CountedClosingAmount!.Value);
            decimal calculated = (await SummaryAsync(session, ct)).CalculatedClosingAmount;

            // Lo cobrado por cada método pasa a la cuenta de tesorería elegida; sin cuenta para un método con monto, no se cierra.
            var targets = new Dictionary<PaymentMethod, long?>();
            foreach (PaymentTransferAllocation allocation in request.PaymentTransfers ?? new())
                if (allocation.PaymentMethod is not null) targets[allocation.PaymentMethod.Value] = allocation.TreasuryAccountId;
            foreach ((PaymentMethod method, decimal amount) in await PaymentTotalsAsync(session.Id, ct))
            {
                if (amount <= 0) continue;
                if (targets.GetValueOrDefault(method) is not long accountId)
                    throw new BadRequestException("Selecciona una cuenta para " + method.Label());
                await _accountMovements.RegisterMovementAsync(accountId, amount, AccountMovementType.CASHBOX_CLOSING,
                    $"Cierre caja #{session.Id} - {method.Label()}", _clock.Now, null, ct);
            }

            session.Status = CashSessionStatus.CLOSED;
            session.ClosedAt = _clock.Now;
            session.CountedClosingAmount = counted;
            session.CalculatedClosingAmount = calculated;
            session.DifferenceAmount = Money(counted - calculated);
            session.ClosingNotes = request.Notes;
            await _db.SaveChangesAsync(ct);
            return await SummaryAsync(session, ct);
        }, ct);

    public async Task<PaginatedResponse<CashSessionHistoryResponse>> HistoryAsync(long? branchId, long? cashierId, DateTime? startDate,
        DateTime? endDate, int page, int size, CancellationToken ct = default)
    {
        IQueryable<CashSession> query = WithNames().AsNoTracking().Where(s => s.Status == CashSessionStatus.CLOSED);
        if (branchId is > 0) query = query.Where(s => s.BranchId == branchId);
        if (cashierId is > 0) query = query.Where(s => s.CashierId == cashierId);
        if (startDate is not null) query = query.Where(s => s.OpenedAt >= startDate);
        if (endDate is not null) query = query.Where(s => s.OpenedAt <= endDate);

        page = Math.Max(page, 0);
        size = Math.Max(size, 1);
        long total = await query.LongCountAsync(ct);
        List<CashSession> rows = await query.OrderByDescending(s => s.OpenedAt).ThenByDescending(s => s.Id)
            .Skip(page * size).Take(size).ToListAsync(ct);
        var content = new List<CashSessionHistoryResponse>();
        foreach (CashSession s in rows)
        {
            decimal calculated = s.CalculatedClosingAmount ?? (await SummaryAsync(s, ct)).CalculatedClosingAmount;
            content.Add(new CashSessionHistoryResponse(s.Id, s.BranchId, s.Branch?.Name, s.CashierId, s.Cashier?.Employee?.FullName,
                s.OpenedAt, s.ClosedAt, s.OpeningAmount, calculated, s.CountedClosingAmount, s.DifferenceAmount, s.ClosingNotes));
        }
        return PaginatedResponse<CashSessionHistoryResponse>.Of(content, total, page, size);
    }

    // ---- Cálculos ----

    /// <summary>Totales por método de pago de las ventas completadas de la caja (todos los métodos, aunque sea 0).</summary>
    private async Task<SortedDictionary<PaymentMethod, decimal>> PaymentTotalsAsync(long sessionId, CancellationToken ct)
    {
        var rows = await _db.SalePayments
            .Where(p => p.CashSessionId == sessionId && p.Sale.Status == SaleStatus.COMPLETED)
            .GroupBy(p => p.PaymentMethod)
            .Select(g => new { Method = g.Key, Total = g.Sum(p => p.AmountPaid) })
            .ToListAsync(ct);
        var totals = new SortedDictionary<PaymentMethod, decimal>();
        foreach (PaymentMethod method in Enum.GetValues<PaymentMethod>()) totals[method] = 0m;
        foreach (var row in rows) totals[row.Method] = Money(row.Total);
        return totals;
    }

    private async Task<CashSessionSummaryResponse> SummaryAsync(CashSession session, CancellationToken ct)
    {
        var payments = _db.SalePayments.Where(p => p.CashSessionId == session.Id && p.Sale.Status == SaleStatus.COMPLETED);
        decimal totalSales = Money(await payments.SumAsync(p => (decimal?)p.AmountPaid, ct) ?? 0m);
        decimal totalCash = Money(await payments.Where(p => p.PaymentMethod == PaymentMethod.CASH).SumAsync(p => (decimal?)p.AmountPaid, ct) ?? 0m);
        var movements = _db.CashSessionMovements.Where(m => m.CashSessionId == session.Id);
        decimal income = Money(await movements.Where(m => m.MovementType == CashMovementType.INCOME).SumAsync(m => (decimal?)m.Amount, ct) ?? 0m);
        decimal expense = Money(await movements.Where(m => m.MovementType == CashMovementType.EXPENSE).SumAsync(m => (decimal?)m.Amount, ct) ?? 0m);
        decimal calculated = Money(session.OpeningAmount + totalCash + income - expense);

        return new CashSessionSummaryResponse(session.Id, session.BranchId, session.Branch?.Name, session.CashierId,
            session.Cashier?.Employee?.FullName, session.Status, session.OpenedAt, session.ClosedAt, session.OpeningAmount,
            totalSales, totalCash, income, expense, calculated, session.CountedClosingAmount, session.DifferenceAmount,
            session.ClosingNotes);
    }

    private async Task<CashSessionDetailResponse> DetailAsync(CashSession session, CancellationToken ct)
    {
        CashSessionSummaryResponse summary = await SummaryAsync(session, ct);
        List<CashMovementResponse> movements = await _db.CashSessionMovements.AsNoTracking()
            .Where(m => m.CashSessionId == session.Id).OrderBy(m => m.Id)
            .Select(m => new CashMovementResponse(m.Id, m.MovementType, m.Amount, m.Reason, m.RegisteredById,
                m.RegisteredBy.Employee.FirstName + " " + m.RegisteredBy.Employee.LastName, m.RegisteredAt, m.Reference))
            .ToListAsync(ct);
        List<CashboxPaymentBreakdownResponse> breakdown = (await PaymentTotalsAsync(session.Id, ct))
            .Select(e => new CashboxPaymentBreakdownResponse(e.Key, e.Key.Label(), e.Value)).ToList();

        var payments = await _db.SalePayments.AsNoTracking()
            .Where(p => p.CashSessionId == session.Id)
            .OrderByDescending(p => p.PaidAt)
            .Select(p => new
            {
                p.Id, p.SaleId, p.PaidAt, p.PaymentMethod, p.AmountPaid,
                CustomerName = p.Sale.Customer != null ? p.Sale.Customer.Name : null,
                p.Sale.DocumentType, p.Sale.DocumentNumber, p.Sale.GrandTotal,
            }).ToListAsync(ct);
        List<CashSessionSalePaymentResponse> salePayments = payments.Select(p =>
        {
            string label = (p.DocumentType ?? SalesDocumentType.NONE).Label();
            string document = string.IsNullOrWhiteSpace(p.DocumentNumber) ? label : label + " " + p.DocumentNumber;
            return new CashSessionSalePaymentResponse(p.Id, p.SaleId, p.PaidAt, p.PaymentMethod, p.AmountPaid,
                p.CustomerName ?? "Cliente General", document, p.GrandTotal);
        }).ToList();

        return new CashSessionDetailResponse(session.Status == CashSessionStatus.OPEN, summary, movements, breakdown, salePayments);
    }
}
