using Microsoft.EntityFrameworkCore;
using VetSaas.Modules.Clinic.Domain;
using VetSaas.Modules.Employees.Domain;
using VetSaas.Modules.Fieldwork.Domain;
using VetSaas.Modules.Inventory.Application;
using VetSaas.Modules.Inventory.Domain;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Persistence;
using VetSaas.Shared.Infrastructure.Time;

namespace VetSaas.Modules.Fieldwork.Application;

internal static class FieldText
{
    public static string? TrimToNull(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();
}

// =====================================================================================================
// Zonas geográficas
// =====================================================================================================

public interface IGeoZoneService
{
    Task<PaginatedResponse<GeoZoneSummaryResponse>> ListAsync(int page, int size, string? q, string? type, long? parentId, bool? active, CancellationToken ct = default);
    Task<GeoZoneResponse> GetAsync(long id, CancellationToken ct = default);
    Task<GeoZoneResponse> CreateAsync(CreateGeoZoneRequest r, CancellationToken ct = default);
    Task<GeoZoneResponse> UpdateAsync(long id, UpdateGeoZoneRequest r, CancellationToken ct = default);
    Task<GeoZoneSummaryResponse> DeleteAsync(long id, CancellationToken ct = default);
}

public sealed class GeoZoneService : IGeoZoneService
{
    private readonly TenantDbContext _db;
    public GeoZoneService(TenantDbContext db) => _db = db;

    private static GeoZoneSummaryResponse Summary(GeoZone z) => new(z.Id, z.Name, z.Type, z.ParentId, z.Parent?.Name, z.Active);
    private static GeoZoneResponse Response(GeoZone z) => new(z.Id, z.Name, z.Type, z.ParentId, z.Parent?.Name, z.GpsCoordinates, z.Active);

    private async Task<GeoZone> RequireAsync(long id, CancellationToken ct) =>
        await _db.GeoZones.Include(z => z.Parent).FirstOrDefaultAsync(z => z.Id == id, ct) ?? throw new InvalidArgumentException("GeoZone no encontrado: id=" + id);

    public async Task<PaginatedResponse<GeoZoneSummaryResponse>> ListAsync(int page, int size, string? q, string? type, long? parentId,
        bool? active, CancellationToken ct = default)
    {
        IQueryable<GeoZone> query = _db.GeoZones.AsNoTracking().Include(z => z.Parent);
        if (!string.IsNullOrWhiteSpace(q)) query = query.Where(z => EF.Functions.ILike(z.Name, $"%{q.Trim()}%"));
        if (type is not null) query = query.Where(z => z.Type == type);
        if (parentId is > 0) query = query.Where(z => z.ParentId == parentId);
        if (active is not null) query = query.Where(z => z.Active == active);
        return (await query.OrderBy(z => z.Name).ThenBy(z => z.Id).ToPageAsync(page, size, ct)).Map(Summary);
    }

    public async Task<GeoZoneResponse> GetAsync(long id, CancellationToken ct = default) => Response(await RequireAsync(id, ct));

    private async Task EnsureUniqueAsync(string name, long? parentId, long? excludeId, CancellationToken ct)
    {
        string lower = name.ToLower();
        bool exists = parentId is null or 0
            ? await _db.GeoZones.AnyAsync(z => z.Name.ToLower() == lower && z.ParentId == null && z.Id != excludeId, ct)
            : await _db.GeoZones.AnyAsync(z => z.Name.ToLower() == lower && z.ParentId == parentId && z.Id != excludeId, ct);
        if (exists)
            throw new InvalidArgumentException(parentId is null or 0
                ? "Ya existe una GeoZone con ese nombre en el nivel raíz."
                : "Ya existe una GeoZone con ese nombre bajo el padre indicado.");
    }

    private static void Apply(GeoZone z, CreateGeoZoneRequest r)
    {
        z.Name = r.Name!.Trim();
        z.Type = r.Type!;
        z.GpsCoordinates = FieldText.TrimToNull(r.GpsCoordinates);
        if (r.Active is not null) z.Active = r.Active.Value;
        z.ParentId = r.ParentId is > 0 ? r.ParentId : null;
    }

    public async Task<GeoZoneResponse> CreateAsync(CreateGeoZoneRequest r, CancellationToken ct = default)
    {
        await EnsureUniqueAsync(r.Name!.Trim(), r.ParentId, null, ct);
        var zone = new GeoZone();
        Apply(zone, r);
        _db.GeoZones.Add(zone);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(zone.Id, ct);
    }

    public async Task<GeoZoneResponse> UpdateAsync(long id, UpdateGeoZoneRequest r, CancellationToken ct = default)
    {
        GeoZone zone = await RequireAsync(id, ct);
        await EnsureUniqueAsync(r.Name!.Trim(), r.ParentId, id, ct);
        Apply(zone, r);
        zone.Parent = null;
        await _db.SaveChangesAsync(ct);
        _db.ChangeTracker.Clear();
        return await GetAsync(id, ct);
    }

    public async Task<GeoZoneSummaryResponse> DeleteAsync(long id, CancellationToken ct = default)
    {
        GeoZone zone = await RequireAsync(id, ct);
        var summary = Summary(zone);
        _db.GeoZones.Remove(zone);
        await _db.SaveChangesAsync(ct);
        return summary;
    }
}

// =====================================================================================================
// Fincas
// =====================================================================================================

public interface IFarmService
{
    Task<PaginatedResponse<FarmSummaryResponse>> ListAsync(int page, int size, string? q, long? customerId, long? zoneId, CancellationToken ct = default);
    Task<FarmResponse> GetAsync(long id, CancellationToken ct = default);
    Task<List<FarmQuickSearchResponse>> QuickSearchAsync(string? q, long? zoneId, CancellationToken ct = default);
    Task<FarmResponse> CreateAsync(CreateFarmRequest r, CancellationToken ct = default);
    Task<FarmResponse> UpdateAsync(long id, UpdateFarmRequest r, CancellationToken ct = default);
    Task<FarmSummaryResponse> DeleteAsync(long id, CancellationToken ct = default);
}

public sealed class FarmService : IFarmService
{
    private readonly TenantDbContext _db;
    public FarmService(TenantDbContext db) => _db = db;

    private IQueryable<Farm> Full() => _db.Farms.Include(f => f.Customer).Include(f => f.Zone);
    private static FarmSummaryResponse Summary(Farm f) => new(f.Id, f.Name, f.CustomerId, f.Customer?.Name, f.ZoneId, f.Zone?.Name);
    private static FarmResponse Response(Farm f) => new(f.Id, f.Name, f.CustomerId, f.Customer?.Name, f.ZoneId, f.Zone?.Name,
        FieldText.TrimToNull(f.LocationDescription), FieldText.TrimToNull(f.GpsCoordinates), FieldText.TrimToNull(f.AddressLabel));

    private async Task<Farm> RequireAsync(long id, CancellationToken ct) =>
        await Full().FirstOrDefaultAsync(f => f.Id == id, ct) ?? throw new InvalidArgumentException("Farm no encontrado: id=" + id);

    public async Task<PaginatedResponse<FarmSummaryResponse>> ListAsync(int page, int size, string? q, long? customerId, long? zoneId, CancellationToken ct = default)
    {
        IQueryable<Farm> query = Full().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q)) query = query.Where(f => EF.Functions.ILike(f.Name, $"%{q.Trim()}%"));
        if (customerId is > 0) query = query.Where(f => f.CustomerId == customerId);
        if (zoneId is > 0) query = query.Where(f => f.ZoneId == zoneId);
        return (await query.OrderBy(f => f.Name).ThenBy(f => f.Id).ToPageAsync(page, size, ct)).Map(Summary);
    }

    public async Task<FarmResponse> GetAsync(long id, CancellationToken ct = default) => Response(await RequireAsync(id, ct));

    public async Task<List<FarmQuickSearchResponse>> QuickSearchAsync(string? q, long? zoneId, CancellationToken ct = default)
    {
        IQueryable<Farm> query = Full().AsNoTracking();
        if (zoneId is > 0) query = query.Where(f => f.ZoneId == zoneId);
        if (!string.IsNullOrWhiteSpace(q)) query = query.Where(f => EF.Functions.ILike(f.Name, $"%{q.Trim()}%"));
        return await query.OrderBy(f => f.Name).Take(10)
            .Select(f => new FarmQuickSearchResponse(f.Id, f.Name, f.Customer.Name, f.ZoneId, f.Zone != null ? f.Zone.Name : null)).ToListAsync(ct);
    }

    private async Task ApplyAsync(Farm f, CreateFarmRequest r, CancellationToken ct)
    {
        if (!await _db.Customers.AnyAsync(c => c.Id == r.CustomerId, ct)) throw new NotFoundException("Cliente no encontrado");
        f.CustomerId = r.CustomerId!.Value;
        f.ZoneId = r.ZoneId is > 0 ? r.ZoneId : null;
        f.Name = r.Name!.Trim();
        f.LocationDescription = FieldText.TrimToNull(r.LocationDescription);
        f.GpsCoordinates = FieldText.TrimToNull(r.GpsCoordinates);
        f.AddressLabel = FieldText.TrimToNull(r.AddressLabel);
    }

    private async Task EnsureUniqueAsync(long? customerId, string name, long? excludeId, CancellationToken ct)
    {
        string lower = name.ToLower();
        if (await _db.Farms.AnyAsync(f => f.CustomerId == customerId && f.Name.ToLower() == lower && f.Id != excludeId, ct))
            throw new InvalidArgumentException("Ya existe una finca con ese nombre para el cliente indicado.");
    }

    public async Task<FarmResponse> CreateAsync(CreateFarmRequest r, CancellationToken ct = default)
    {
        await EnsureUniqueAsync(r.CustomerId, r.Name!.Trim(), null, ct);
        var farm = new Farm();
        await ApplyAsync(farm, r, ct);
        _db.Farms.Add(farm);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(farm.Id, ct);
    }

    public async Task<FarmResponse> UpdateAsync(long id, UpdateFarmRequest r, CancellationToken ct = default)
    {
        Farm farm = await RequireAsync(id, ct);
        await EnsureUniqueAsync(r.CustomerId, r.Name!.Trim(), id, ct);
        await ApplyAsync(farm, r, ct);
        farm.Customer = null!;
        farm.Zone = null;
        await _db.SaveChangesAsync(ct);
        _db.ChangeTracker.Clear();
        return await GetAsync(id, ct);
    }

    public async Task<FarmSummaryResponse> DeleteAsync(long id, CancellationToken ct = default)
    {
        Farm farm = await RequireAsync(id, ct);
        var summary = Summary(farm);
        _db.Farms.Remove(farm);
        await _db.SaveChangesAsync(ct);
        return summary;
    }
}

// =====================================================================================================
// Vehículos, stock móvil y posiciones
// =====================================================================================================

public interface IVehicleService
{
    Task<List<VehicleResponse>> ListAsync(CancellationToken ct = default);
    Task<VehicleResponse> GetAsync(long id, CancellationToken ct = default);
    Task<List<VehicleQuickSearchResponse>> QuickSearchAsync(string? q, bool? onlyActive, CancellationToken ct = default);
    Task<VehicleResponse> CreateAsync(CreateVehicleRequest r, CancellationToken ct = default);
    Task<VehicleResponse> UpdateAsync(long id, UpdateVehicleRequest r, CancellationToken ct = default);
    Task<VehicleResponse> DeleteAsync(long id, CancellationToken ct = default);
    Task<PaginatedResponse<VehicleStockResponse>> StockAsync(long vehicleId, int page, int size, CancellationToken ct = default);
    Task<VehicleStockResponse> AdjustStockAsync(AdjustVehicleStockRequest r, long? employeeId, CancellationToken ct = default);
    Task<PaginatedResponse<ProductStockMovementResponse>> MovementsAsync(long? vehicleId, int page, int size, CancellationToken ct = default);
    Task<VehiclePingResponse> CreatePingAsync(CreateVehiclePingRequest r, CancellationToken ct = default);
    Task<PaginatedResponse<VehiclePingResponse>> PingsAsync(long vehicleId, DateTime from, DateTime to, int page, int size, CancellationToken ct = default);
}

/// <summary>Bloquea (o crea) la fila de stock de un producto en un vehículo hasta el fin de la transacción.</summary>
internal static class VehicleStockLock
{
    public static async Task<ProductVehicleStock> LockOrCreateAsync(TenantDbContext db, long vehicleId, Product product, ProductUnitType defaultUnit,
        CancellationToken ct)
    {
        await db.Database.ExecuteSqlRawAsync(
            "INSERT INTO product_vehicle_stock (vehicle_id, product_id, unit, quantity) VALUES (@v, @p, @u, 0) ON CONFLICT (vehicle_id, product_id) DO NOTHING",
            new object[] { new Npgsql.NpgsqlParameter("v", vehicleId), new Npgsql.NpgsqlParameter("p", product.Id), new Npgsql.NpgsqlParameter("u", defaultUnit.ToString()) }, ct);
        return (await db.ProductVehicleStocks
            .FromSqlInterpolated($"SELECT * FROM product_vehicle_stock WHERE vehicle_id = {vehicleId} AND product_id = {product.Id} FOR UPDATE")
            .ToListAsync(ct)).First();
    }
}

public sealed class VehicleService : IVehicleService
{
    private readonly TenantDbContext _db;
    private readonly IClock _clock;

    public VehicleService(TenantDbContext db, IClock clock)
    {
        _db = db;
        _clock = clock;
    }

    private IQueryable<Vehicle> Full() => _db.Vehicles.Include(v => v.AssignedVet).Include(v => v.HomeBranch);
    private static VehicleResponse Response(Vehicle v) => new(v.Id, v.Name, v.LicensePlate, v.AssignedVetId, v.AssignedVet?.FullName, v.HomeBranchId,
        v.HomeBranch?.Name, v.Active);

    private async Task<Vehicle> RequireAsync(long id, CancellationToken ct) =>
        await Full().FirstOrDefaultAsync(v => v.Id == id, ct) ?? throw new InvalidArgumentException("Vehículo no encontrado");

    public async Task<List<VehicleResponse>> ListAsync(CancellationToken ct = default) =>
        (await Full().AsNoTracking().OrderBy(v => v.Name).ToListAsync(ct)).Select(Response).ToList();

    public async Task<VehicleResponse> GetAsync(long id, CancellationToken ct = default) => Response(await RequireAsync(id, ct));

    public async Task<List<VehicleQuickSearchResponse>> QuickSearchAsync(string? q, bool? onlyActive, CancellationToken ct = default)
    {
        IQueryable<Vehicle> query = _db.Vehicles.AsNoTracking();
        if (onlyActive == true) query = query.Where(v => v.Active);
        if (!string.IsNullOrWhiteSpace(q)) query = query.Where(v => EF.Functions.ILike(v.Name, $"%{q.Trim()}%"));
        return await query.OrderBy(v => v.Name).Take(10).Select(v => new VehicleQuickSearchResponse(v.Id, v.Name, v.LicensePlate, v.Active)).ToListAsync(ct);
    }

    private static void Apply(Vehicle v, CreateVehicleRequest r)
    {
        v.Name = r.Name!.Trim();
        v.LicensePlate = r.LicensePlate;
        v.AssignedVetId = r.AssignedVetEmployeeId;
        v.HomeBranchId = r.HomeBranchId;
        if (r.Active is not null) v.Active = r.Active.Value;
    }

    public async Task<VehicleResponse> CreateAsync(CreateVehicleRequest r, CancellationToken ct = default)
    {
        string lower = r.Name!.Trim().ToLower();
        if (await _db.Vehicles.AnyAsync(v => v.Name.ToLower() == lower, ct)) throw new InvalidArgumentException("Ya existe un vehículo con ese nombre");
        var vehicle = new Vehicle();
        Apply(vehicle, r);
        _db.Vehicles.Add(vehicle);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(vehicle.Id, ct);
    }

    public async Task<VehicleResponse> UpdateAsync(long id, UpdateVehicleRequest r, CancellationToken ct = default)
    {
        Vehicle vehicle = await RequireAsync(id, ct);
        string lower = r.Name!.Trim().ToLower();
        if (await _db.Vehicles.AnyAsync(v => v.Name.ToLower() == lower && v.Id != id, ct)) throw new InvalidArgumentException("Ya existe un vehículo con ese nombre");
        Apply(vehicle, r);
        vehicle.AssignedVet = null;
        vehicle.HomeBranch = null;
        await _db.SaveChangesAsync(ct);
        _db.ChangeTracker.Clear();
        return await GetAsync(id, ct);
    }

    public async Task<VehicleResponse> DeleteAsync(long id, CancellationToken ct = default)
    {
        Vehicle vehicle = await RequireAsync(id, ct);
        var response = Response(vehicle);
        _db.Vehicles.Remove(vehicle);
        await _db.SaveChangesAsync(ct);
        return response;
    }

    public async Task<PaginatedResponse<VehicleStockResponse>> StockAsync(long vehicleId, int page, int size, CancellationToken ct = default) =>
        await _db.ProductVehicleStocks.AsNoTracking().Where(s => s.VehicleId == vehicleId)
            .OrderBy(s => s.Product.Name).ThenBy(s => s.Id)
            .Select(s => new VehicleStockResponse(s.Id, s.VehicleId, s.ProductId, s.Product.Name, s.Product.Sku, s.Unit, s.Quantity))
            .ToPageAsync(page, size, ct);

    public Task<VehicleStockResponse> AdjustStockAsync(AdjustVehicleStockRequest r, long? employeeId, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            if (!await _db.Vehicles.AnyAsync(v => v.Id == r.VehicleId, ct)) throw new NotFoundException("Vehículo no encontrado");
            Product product = await _db.Products.FirstOrDefaultAsync(p => p.Id == r.ProductId, ct) ?? throw new NotFoundException("Producto no encontrado");
            ProductVehicleStock stock = await VehicleStockLock.LockOrCreateAsync(_db, r.VehicleId!.Value, product, r.Unit ?? product.UnitType, ct);
            ProductUnitType unit = r.Unit ?? stock.Unit;
            if (stock.Unit != unit) throw new InvalidArgumentException("La unidad indicada no coincide con la unidad registrada en el vehículo.");
            int delta = r.QuantityDelta!.Value;
            stock.Quantity += delta;
            _db.ProductStockMovements.Add(new ProductStockMovement
            {
                MovementType = delta >= 0 ? StockMovementType.LOAD_TO_VEHICLE : StockMovementType.ADJUSTMENT,
                ProductId = product.Id, QuantityDelta = delta,
                FromType = delta >= 0 ? StockLocationType.BRANCH_WAREHOUSE : StockLocationType.VEHICLE, ToType = StockLocationType.VEHICLE,
                VehicleId = r.VehicleId, CreatedById = employeeId, Unit = stock.Unit, CreatedAt = _clock.Now, Notes = r.Notes,
            });
            await _db.SaveChangesAsync(ct);
            return new VehicleStockResponse(stock.Id, stock.VehicleId, product.Id, product.Name, product.Sku, stock.Unit, stock.Quantity);
        }, ct);

    public async Task<PaginatedResponse<ProductStockMovementResponse>> MovementsAsync(long? vehicleId, int page, int size, CancellationToken ct = default)
    {
        IQueryable<ProductStockMovement> query = _db.ProductStockMovements.AsNoTracking();
        if (vehicleId is not null) query = query.Where(m => m.VehicleId == vehicleId);
        return await query.OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id)
            .Select(m => new ProductStockMovementResponse(m.Id, m.MovementType, m.ProductId, m.Product.Name, m.Unit, m.QuantityDelta, m.FromType, m.ToType,
                m.VehicleId, m.BranchId, m.FieldVisitId, m.CreatedById, m.CreatedAt, m.Notes))
            .ToPageAsync(page, size, ct);
    }

    public async Task<VehiclePingResponse> CreatePingAsync(CreateVehiclePingRequest r, CancellationToken ct = default)
    {
        var ping = new VehicleLocationPing
        {
            VehicleId = r.VehicleId!.Value, EmployeeId = r.EmployeeId, Timestamp = r.Timestamp!.Value, Latitude = r.Latitude!.Value,
            Longitude = r.Longitude!.Value, SpeedKmh = r.SpeedKmh, Note = r.Note,
        };
        _db.VehicleLocationPings.Add(ping);
        await _db.SaveChangesAsync(ct);
        return new VehiclePingResponse(ping.Id, ping.VehicleId, ping.Timestamp, ping.Latitude, ping.Longitude, ping.SpeedKmh, ping.Note);
    }

    public async Task<PaginatedResponse<VehiclePingResponse>> PingsAsync(long vehicleId, DateTime from, DateTime to, int page, int size,
        CancellationToken ct = default) =>
        await _db.VehicleLocationPings.AsNoTracking().Where(p => p.VehicleId == vehicleId && p.Timestamp >= from && p.Timestamp <= to)
            .OrderByDescending(p => p.Timestamp).ThenByDescending(p => p.Id)
            .Select(p => new VehiclePingResponse(p.Id, p.VehicleId, p.Timestamp, p.Latitude, p.Longitude, p.SpeedKmh, p.Note))
            .ToPageAsync(page, size, ct);
}

// =====================================================================================================
// Visitas de campo
// =====================================================================================================

public interface IFieldVisitService
{
    Task<PaginatedResponse<FieldVisitSummaryResponse>> ListAsync(int page, int size, string? q, FieldVisitStatus? status, long? vetId, long? farmId,
        long? zoneId, long? vehicleId, DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<FieldVisitResponse> GetAsync(long id, CancellationToken ct = default);
    Task<FieldVisitResponse> CreateAsync(CreateFieldVisitRequest r, CancellationToken ct = default);
    Task<FieldVisitResponse> UpdateAsync(long id, UpdateFieldVisitRequest r, CancellationToken ct = default);
    Task<FieldVisitSummaryResponse> DeleteAsync(long id, CancellationToken ct = default);
    Task<FieldVisitServiceItemResponse> AddServiceItemAsync(long visitId, AddServiceItemRequest r, CancellationToken ct = default);
    Task<FieldVisitReportResponse> UpdateReportAsync(long visitId, UpdateFieldVisitReportRequest r, CancellationToken ct = default);
    Task<FieldVisitResponse> UpdateStatusAsync(long visitId, FieldVisitStatus status, CancellationToken ct = default);
    Task<FieldVisitProductUsageResponse> AddProductUsageAsync(long visitId, AddProductUsageRequest r, long? performedById, CancellationToken ct = default);
    Task<FieldVisitAttachmentResponse> AddAttachmentAsync(long visitId, AddAttachmentRequest r, CancellationToken ct = default);
    Task<FieldVisitBiosecurityResponse> SetBiosecurityAsync(long visitId, SetBiosecurityRequest r, CancellationToken ct = default);
    Task<FieldVisitSummaryResponse> SummaryAsync(long id, CancellationToken ct = default);
}

internal static class FieldVisitMapping
{
    public static IQueryable<FieldVisit> WithSummary(this IQueryable<FieldVisit> q) => q
        .Include(v => v.Farm!).ThenInclude(f => f.Zone).Include(v => v.Zone).Include(v => v.FieldVet).Include(v => v.Vehicle)
        .Include(v => v.Companions).ThenInclude(c => c.Employee);

    public static IQueryable<FieldVisit> Full(this IQueryable<FieldVisit> q) => q.WithSummary()
        .Include(v => v.ServiceItems).ThenInclude(i => i.ClinicalService)
        .Include(v => v.ServiceItems).ThenInclude(i => i.PerformedBy)
        .Include(v => v.ServiceItems).ThenInclude(i => i.Animals).ThenInclude(a => a.Animal)
        .Include(v => v.ServiceItems).ThenInclude(i => i.Groups)
        .Include(v => v.ServiceItems).ThenInclude(i => i.Products).ThenInclude(p => p.Product)
        .Include(v => v.ProductUsages).ThenInclude(u => u.Product)
        .Include(v => v.ProductUsages).ThenInclude(u => u.SourceVehicle)
        .Include(v => v.Attachments).Include(v => v.Biosecurity).Include(v => v.Report)
        .AsSplitQuery();

    private static GeoZone? ZoneOf(FieldVisit v) => v.Zone ?? v.Farm?.Zone;

    private static List<FieldVisitCompanionResponse> Companions(FieldVisit v) => v.Companions
        .OrderBy(c => c.Employee.FullName, StringComparer.OrdinalIgnoreCase)
        .Select(c => new FieldVisitCompanionResponse(c.EmployeeId, c.Employee.FullName)).ToList();

    public static FieldVisitSummaryResponse ToSummary(FieldVisit v) => new(v.Id, v.FarmId, v.Farm?.Name, ZoneOf(v)?.Id, ZoneOf(v)?.Name,
        v.ScheduledDateTime, v.Status, v.FieldVetId, v.FieldVet?.FullName, v.VehicleId, v.Vehicle?.Name, v.Objective, Companions(v));

    public static FieldVisitServiceItemResponse ToServiceItem(FieldVisitServiceItem i) => new(i.Id, i.ClinicalServiceId, i.ClinicalService.Name,
        i.Quantity, i.UnitPrice, i.PerformedById, i.PerformedBy?.FullName, i.Notes,
        i.Animals.Select(a => new FieldVisitServiceAnimalResponse(a.Id, a.AnimalId, a.Animal?.Name, a.Animal?.Species, a.Animal?.Breed)).ToList(),
        i.Groups.Select(g => new FieldVisitServiceGroupResponse(g.Id, g.Species, g.Breed, g.Quantity, g.Description)).ToList(),
        i.Products.Select(p => new FieldVisitServiceProductResponse(p.Id, p.Product is null ? null : ProductBasicResponse.From(p.Product), p.Dose,
            p.Unit, p.AdministrationRoute)).ToList());

    public static FieldVisitProductUsageResponse ToProductUsage(FieldVisitProductUsage u) => new(u.Id, u.ProductId, u.Product?.Name, u.Unit,
        u.QuantityUsed, u.UnitPrice, u.Subtotal, u.SourceVehicleId, u.SourceVehicle?.Name, u.Notes);

    public static FieldVisitReportResponse ToReport(FieldVisitReport r) => new(r.Id, r.Version, r.Findings, r.Diagnoses, r.Recommendations, r.UpdatedAt);

    public static FieldVisitBiosecurityResponse ToBiosecurity(FieldVisitBiosecurity b) =>
        new(b.VehicleAndEquipmentCleaned, b.PpeUsed, b.HandHygiene, b.Notes);

    public static FieldVisitResponse ToResponse(FieldVisit v) => new(v.Id, v.FarmId, v.Farm?.Name, ZoneOf(v)?.Id, ZoneOf(v)?.Name, v.ScheduledDateTime,
        v.Status, v.FieldVetId, v.FieldVet?.FullName, v.VehicleId, v.Vehicle?.Name, v.Objective, Companions(v),
        v.ServiceItems.OrderBy(i => i.Id).Select(ToServiceItem).ToList(),
        v.ProductUsages.OrderBy(u => u.Id).Select(ToProductUsage).ToList(),
        v.Biosecurity is null ? null : ToBiosecurity(v.Biosecurity),
        v.Attachments.OrderBy(a => a.Id).Select(a => new FieldVisitAttachmentResponse(a.Id, a.FileName, a.FileUrl, a.MimeType)).ToList(),
        v.Report is null ? null : ToReport(v.Report));
}

public sealed class FieldVisitService : IFieldVisitService
{
    private readonly TenantDbContext _db;
    private readonly IClock _clock;

    public FieldVisitService(TenantDbContext db, IClock clock)
    {
        _db = db;
        _clock = clock;
    }

    private async Task<FieldVisit> RequireAsync(long id, CancellationToken ct, string? message = null) =>
        await _db.FieldVisits.Include(v => v.Companions).FirstOrDefaultAsync(v => v.Id == id, ct)
        ?? throw new InvalidArgumentException(message ?? "FieldVisit no encontrado: id=" + id);

    public async Task<PaginatedResponse<FieldVisitSummaryResponse>> ListAsync(int page, int size, string? q, FieldVisitStatus? status, long? vetId,
        long? farmId, long? zoneId, long? vehicleId, DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        IQueryable<FieldVisit> query = _db.FieldVisits.AsNoTracking().WithSummary();
        if (!string.IsNullOrWhiteSpace(q))
        {
            string like = $"%{q.Trim()}%";
            query = query.Where(v => EF.Functions.ILike(v.Objective ?? "", like) || EF.Functions.ILike(v.Farm != null ? v.Farm.Name : "", like) ||
                                     EF.Functions.ILike(v.Zone != null ? v.Zone.Name : "", like) ||
                                     EF.Functions.ILike(v.Farm != null && v.Farm.Zone != null ? v.Farm.Zone.Name : "", like));
        }
        if (status is not null) query = query.Where(v => v.Status == status);
        if (vetId is > 0) query = query.Where(v => v.FieldVetId == vetId);
        if (farmId is > 0) query = query.Where(v => v.FarmId == farmId);
        if (zoneId is > 0) query = query.Where(v => v.ZoneId == zoneId || (v.Farm != null && v.Farm.ZoneId == zoneId));
        if (vehicleId is > 0) query = query.Where(v => v.VehicleId == vehicleId);
        if (from is not null) query = query.Where(v => v.ScheduledDateTime >= from);
        if (to is not null) query = query.Where(v => v.ScheduledDateTime <= to);
        return (await query.OrderByDescending(v => v.ScheduledDateTime).ThenByDescending(v => v.Id).ToPageAsync(page, size, ct)).Map(FieldVisitMapping.ToSummary);
    }

    /// <summary>El detalle siempre incluye su reporte (se crea vacío la primera vez).</summary>
    public Task<FieldVisitResponse> GetAsync(long id, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            await RequireAsync(id, ct);
            await EnsureReportAsync(id, ct);
            _db.ChangeTracker.Clear();
            return FieldVisitMapping.ToResponse(await _db.FieldVisits.AsNoTracking().Full().FirstAsync(v => v.Id == id, ct));
        }, ct);

    public async Task<FieldVisitSummaryResponse> SummaryAsync(long id, CancellationToken ct = default) =>
        FieldVisitMapping.ToSummary(await _db.FieldVisits.AsNoTracking().WithSummary().FirstAsync(v => v.Id == id, ct));

    private async Task<FieldVisitReport> EnsureReportAsync(long visitId, CancellationToken ct)
    {
        await _db.Database.ExecuteSqlRawAsync(
            "INSERT INTO field_visit_report (field_visit_id) VALUES (@v) ON CONFLICT (field_visit_id) DO NOTHING",
            new object[] { new Npgsql.NpgsqlParameter("v", visitId) }, ct);
        return await _db.FieldVisitReports.FirstAsync(r => r.FieldVisitId == visitId, ct);
    }

    private void SyncCompanions(FieldVisit visit, IEnumerable<long?>? companionIds)
    {
        var desired = (companionIds ?? Enumerable.Empty<long?>()).Where(id => id is not null && id != visit.FieldVetId).Select(id => id!.Value).ToHashSet();
        foreach (FieldVisitCompanion c in visit.Companions.Where(c => !desired.Contains(c.EmployeeId)).ToList())
        {
            visit.Companions.Remove(c);
            _db.FieldVisitCompanions.Remove(c);
        }
        var existing = visit.Companions.Select(c => c.EmployeeId).ToHashSet();
        foreach (long id in desired.Where(id => !existing.Contains(id)))
            visit.Companions.Add(new FieldVisitCompanion { FieldVisit = visit, EmployeeId = id });
    }

    private static void ValidateTransition(FieldVisitStatus current, FieldVisitStatus? target)
    {
        if (target is null) throw new InvalidArgumentException("El estado de la visita es obligatorio");
        if (current == target) return;
        bool allowed = current switch
        {
            FieldVisitStatus.PLANNED => target is FieldVisitStatus.IN_PROGRESS or FieldVisitStatus.CANCELED,
            FieldVisitStatus.IN_PROGRESS => target is FieldVisitStatus.COMPLETED or FieldVisitStatus.CANCELED,
            _ => false,
        };
        if (!allowed) throw new BusinessRuleException($"Transición de visita no permitida: {current} → {target}");
    }

    private static void AssertOpen(FieldVisit visit)
    {
        if (visit.Status is FieldVisitStatus.COMPLETED or FieldVisitStatus.CANCELED)
            throw new BusinessRuleException($"La visita está {visit.Status} y ya no admite registros");
    }

    public Task<FieldVisitResponse> CreateAsync(CreateFieldVisitRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            if (r.FarmId is null && r.ZoneId is null)
                throw new InvalidArgumentException("Debe seleccionar una finca o una zona para planificar la visita.");
            var visit = new FieldVisit
            {
                FarmId = r.FarmId, ZoneId = r.ZoneId, FieldVetId = r.FieldVetId!.Value, VehicleId = r.VehicleId,
                ScheduledDateTime = r.ScheduledDateTime!.Value, Objective = r.Objective, Status = FieldVisitStatus.PLANNED,
            };
            SyncCompanions(visit, r.CompanionIds);
            _db.FieldVisits.Add(visit);
            await _db.SaveChangesAsync(ct);
            _db.ChangeTracker.Clear();
            return FieldVisitMapping.ToResponse(await _db.FieldVisits.AsNoTracking().Full().FirstAsync(v => v.Id == visit.Id, ct));
        }, ct);

    public Task<FieldVisitResponse> UpdateAsync(long id, UpdateFieldVisitRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            FieldVisit visit = await RequireAsync(id, ct);
            if (r.FarmId is null && r.ZoneId is null)
                throw new InvalidArgumentException("Debe seleccionar una finca o una zona para planificar la visita.");
            ValidateTransition(visit.Status, r.Status);
            visit.FarmId = r.FarmId;
            visit.ZoneId = r.ZoneId;
            visit.FieldVetId = r.FieldVetId!.Value;
            visit.VehicleId = r.VehicleId;
            visit.ScheduledDateTime = r.ScheduledDateTime!.Value;
            visit.Objective = r.Objective;
            visit.Status = r.Status!.Value;
            visit.RouteOrder = r.RouteOrder;
            SyncCompanions(visit, r.CompanionIds);
            await _db.SaveChangesAsync(ct);
            _db.ChangeTracker.Clear();
            return FieldVisitMapping.ToResponse(await _db.FieldVisits.AsNoTracking().Full().FirstAsync(v => v.Id == id, ct));
        }, ct);

    public Task<FieldVisitSummaryResponse> DeleteAsync(long id, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            FieldVisit visit = await _db.FieldVisits.WithSummary().FirstOrDefaultAsync(v => v.Id == id, ct)
                ?? throw new InvalidArgumentException("FieldVisit no encontrado: id=" + id);
            if (visit.Status != FieldVisitStatus.PLANNED)
                throw new BusinessRuleException("Solo se puede eliminar una visita planificada. Cancélala para conservar su historial.");
            var summary = FieldVisitMapping.ToSummary(visit);
            _db.FieldVisits.Remove(visit);
            await _db.SaveChangesAsync(ct);
            return summary;
        }, ct);

    public Task<FieldVisitServiceItemResponse> AddServiceItemAsync(long visitId, AddServiceItemRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            FieldVisit visit = await RequireAsync(visitId, ct, "Visita no encontrada: id=" + visitId);
            AssertOpen(visit);
            ClinicalService service = await _db.ClinicalServices.FirstOrDefaultAsync(s => s.Id == r.ClinicalServiceId, ct)
                ?? throw new InvalidArgumentException("Servicio clínico no encontrado: id=" + r.ClinicalServiceId);
            Employee? performer = r.PerformedById is null
                ? null
                : await _db.Employees.FirstOrDefaultAsync(e => e.Id == r.PerformedById, ct) ?? throw new InvalidArgumentException("Empleado no encontrado: id=" + r.PerformedById);
            var item = new FieldVisitServiceItem
            {
                FieldVisitId = visit.Id, ClinicalService = service, Quantity = r.Quantity!.Value, UnitPrice = r.UnitPrice!.Value,
                PerformedBy = performer, Notes = FieldText.TrimToNull(r.Notes),
            };
            foreach (long animalId in (r.AnimalIds ?? new()).Distinct())
            {
                var animal = await _db.Animals.FirstOrDefaultAsync(a => a.Id == animalId, ct) ?? throw new InvalidArgumentException("Animal no encontrado: id=" + animalId);
                item.Animals.Add(new FieldVisitServiceAnimal { ServiceItem = item, Animal = animal });
            }
            foreach (FieldVisitServiceGroupInput g in (r.Groups ?? new()).Where(g => g?.Quantity is > 0))
                item.Groups.Add(new FieldVisitServiceGroup
                {
                    ServiceItem = item, Species = g.Species, Breed = FieldText.TrimToNull(g.Breed), Quantity = g.Quantity,
                    Description = FieldText.TrimToNull(g.Description),
                });
            foreach (FieldVisitServiceProductInput p in (r.Products ?? new()).Where(p => p?.ProductId is not null))
            {
                Product product = await _db.Products.FirstOrDefaultAsync(x => x.Id == p.ProductId, ct)
                    ?? throw new InvalidArgumentException("Producto no encontrado: id=" + p.ProductId);
                item.Products.Add(new FieldVisitServiceProduct
                {
                    ServiceItem = item, Product = product, Dose = p.Dose, Unit = p.Unit!.Value, AdministrationRoute = p.AdministrationRoute!,
                });
            }
            _db.FieldVisitServiceItems.Add(item);
            await _db.SaveChangesAsync(ct);
            return FieldVisitMapping.ToServiceItem(item);
        }, ct);

    public Task<FieldVisitReportResponse> UpdateReportAsync(long visitId, UpdateFieldVisitReportRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            await RequireAsync(visitId, ct, "Visita no encontrada: id=" + visitId);
            FieldVisitReport report = await EnsureReportAsync(visitId, ct);
            if (report.Version != r.Version)
                throw new BusinessRuleException("El reporte fue actualizado por otro usuario. Recarga la página e inténtalo nuevamente.");
            if (r.Findings.IsPresent) report.Findings = FieldText.TrimToNull(r.Findings.Value);
            if (r.Diagnoses.IsPresent) report.Diagnoses = FieldText.TrimToNull(r.Diagnoses.Value);
            if (r.Recommendations.IsPresent) report.Recommendations = FieldText.TrimToNull(r.Recommendations.Value);
            report.UpdatedAt = _clock.Now;
            await _db.SaveChangesAsync(ct);
            return FieldVisitMapping.ToReport(report);
        }, ct);

    public Task<FieldVisitResponse> UpdateStatusAsync(long visitId, FieldVisitStatus status, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            FieldVisit visit = await RequireAsync(visitId, ct, "Visita no encontrada: id=" + visitId);
            ValidateTransition(visit.Status, status);
            visit.Status = status;
            await _db.SaveChangesAsync(ct);
            await EnsureReportAsync(visitId, ct);
            _db.ChangeTracker.Clear();
            return FieldVisitMapping.ToResponse(await _db.FieldVisits.AsNoTracking().Full().FirstAsync(v => v.Id == visitId, ct));
        }, ct);

    /// <summary>El insumo sale del stock del vehículo (bloqueado por fila: dos consumos a la vez no lo dejan en negativo).</summary>
    public Task<FieldVisitProductUsageResponse> AddProductUsageAsync(long visitId, AddProductUsageRequest r, long? performedById, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            FieldVisit visit = await RequireAsync(visitId, ct, "Visita no encontrada");
            AssertOpen(visit);
            Product product = await _db.Products.FirstOrDefaultAsync(p => p.Id == r.ProductId, ct) ?? throw new NotFoundException("Producto no encontrado");
            long vehicleId = r.VehicleId ?? visit.VehicleId ?? throw new InvalidArgumentException("Se requiere un vehículo para el consumo de insumos.");
            Vehicle vehicle = await _db.Vehicles.FirstOrDefaultAsync(v => v.Id == vehicleId, ct) ?? throw new NotFoundException("Vehículo no encontrado");
            ProductVehicleStock stock = await VehicleStockLock.LockOrCreateAsync(_db, vehicleId, product, product.UnitType, ct);
            if (r.Unit is not null && stock.Unit != r.Unit)
                throw new InvalidArgumentException("La unidad solicitada no coincide con el inventario del vehículo.");
            int quantity = r.QuantityUsed!.Value;
            if (stock.Quantity - quantity < 0) throw new InvalidArgumentException("Stock insuficiente en el vehículo.");
            stock.Quantity -= quantity;

            _db.ProductStockMovements.Add(new ProductStockMovement
            {
                MovementType = StockMovementType.CONSUMPTION, ProductId = product.Id, QuantityDelta = -Math.Abs(quantity),
                FromType = StockLocationType.VEHICLE, ToType = StockLocationType.FIELD, VehicleId = vehicleId, FieldVisitId = visit.Id,
                CreatedById = performedById, Unit = stock.Unit, CreatedAt = _clock.Now, Notes = r.Notes,
            });
            var usage = new FieldVisitProductUsage
            {
                FieldVisitId = visit.Id, Product = product, Unit = stock.Unit, QuantityUsed = quantity, SourceVehicle = vehicle,
                Notes = FieldText.TrimToNull(r.Notes), UnitPrice = r.UnitPrice, Subtotal = r.UnitPrice * quantity,
            };
            _db.FieldVisitProductUsages.Add(usage);
            await _db.SaveChangesAsync(ct);
            return FieldVisitMapping.ToProductUsage(usage);
        }, ct);

    public async Task<FieldVisitAttachmentResponse> AddAttachmentAsync(long visitId, AddAttachmentRequest r, CancellationToken ct = default)
    {
        var attachment = new FieldVisitAttachment { FieldVisitId = visitId, FileName = r.FileName!, FileUrl = r.FileUrl!, MimeType = r.MimeType };
        _db.FieldVisitAttachments.Add(attachment);
        await _db.SaveChangesAsync(ct);
        return new FieldVisitAttachmentResponse(attachment.Id, attachment.FileName, attachment.FileUrl, attachment.MimeType);
    }

    public async Task<FieldVisitBiosecurityResponse> SetBiosecurityAsync(long visitId, SetBiosecurityRequest r, CancellationToken ct = default)
    {
        FieldVisit visit = await _db.FieldVisits.Include(v => v.Biosecurity).FirstOrDefaultAsync(v => v.Id == visitId, ct)
            ?? throw new InvalidArgumentException("Visita no encontrada");
        FieldVisitBiosecurity b = visit.Biosecurity ??= new FieldVisitBiosecurity { FieldVisit = visit };
        if (r.VehicleAndEquipmentCleaned is not null) b.VehicleAndEquipmentCleaned = r.VehicleAndEquipmentCleaned.Value;
        if (r.PpeUsed is not null) b.PpeUsed = r.PpeUsed.Value;
        if (r.HandHygiene is not null) b.HandHygiene = r.HandHygiene.Value;
        b.Notes = r.Notes;
        await _db.SaveChangesAsync(ct);
        return FieldVisitMapping.ToBiosecurity(b);
    }
}

// =====================================================================================================
// Tareas de campo, rutas y estado del equipo
// =====================================================================================================

public interface IFieldTaskService
{
    Task<PaginatedResponse<FieldTaskSummaryResponse>> ListAsync(int page, int size, string? q, FieldTaskStatus? status, string? priority,
        long? assignedToId, long? farmId, long? zoneId, DateTime? dueFrom, DateTime? dueTo, CancellationToken ct = default);
    Task<FieldTaskResponse> GetAsync(long id, CancellationToken ct = default);
    Task<List<FieldTaskResponse>> CreateAsync(CreateFieldTaskRequest r, long? createdById, CancellationToken ct = default);
    Task<FieldTaskResponse> UpdateAsync(long id, UpdateFieldTaskRequest r, CancellationToken ct = default);
    Task<FieldTaskSummaryResponse> DeleteAsync(long id, CancellationToken ct = default);
    Task<FieldVisitSummaryResponse> AssignAsync(long taskId, AssignFieldTaskRequest r, long? assignedById, CancellationToken ct = default);
}

public sealed class FieldTaskService : IFieldTaskService
{
    private readonly TenantDbContext _db;
    private readonly IFieldVisitService _visits;
    private readonly IClock _clock;

    public FieldTaskService(TenantDbContext db, IFieldVisitService visits, IClock clock)
    {
        _db = db;
        _visits = visits;
        _clock = clock;
    }

    private IQueryable<FieldTask> Full() => _db.FieldTasks
        .Include(t => t.Farm).ThenInclude(f => f.Zone).Include(t => t.Zone).Include(t => t.AssignedTo)
        .Include(t => t.CreatedFieldVisit!).ThenInclude(v => v.Vehicle);

    private static FieldTaskSummaryResponse Summary(FieldTask t)
    {
        GeoZone? zone = t.Zone ?? t.Farm?.Zone;
        FieldVisit? visit = t.CreatedFieldVisit;
        return new FieldTaskSummaryResponse(t.Id, t.Title, t.FarmId, t.Farm?.Name, zone?.Id, zone?.Name, t.Priority, t.Status, t.AssignedToId,
            t.AssignedTo?.FullName, t.DueAt, visit?.Id, visit?.Status, visit?.VehicleId, visit?.Vehicle?.Name);
    }

    private static FieldTaskResponse Response(FieldTask t)
    {
        FieldTaskSummaryResponse s = Summary(t);
        return new FieldTaskResponse(s.Id, s.Title, s.FarmId, s.FarmName, s.ZoneId, s.ZoneName, s.Priority, s.Status, s.AssignedToId, s.AssignedToName,
            s.DueAt, s.CreatedFieldVisitId, s.CreatedFieldVisitStatus, s.VehicleId, s.VehicleName, t.Description);
    }

    private async Task<FieldTask> RequireAsync(long id, CancellationToken ct) =>
        await Full().FirstOrDefaultAsync(t => t.Id == id, ct) ?? throw new InvalidArgumentException("Tarea no encontrada");

    public async Task<PaginatedResponse<FieldTaskSummaryResponse>> ListAsync(int page, int size, string? q, FieldTaskStatus? status,
        string? priority, long? assignedToId, long? farmId, long? zoneId, DateTime? dueFrom, DateTime? dueTo, CancellationToken ct = default)
    {
        IQueryable<FieldTask> query = Full().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q))
        {
            string like = $"%{q.Trim()}%";
            query = query.Where(t => EF.Functions.ILike(t.Title, like) || EF.Functions.ILike(t.Description ?? "", like));
        }
        if (status is not null) query = query.Where(t => t.Status == status);
        if (priority is not null) query = query.Where(t => t.Priority == priority);
        if (assignedToId is > 0) query = query.Where(t => t.AssignedToId == assignedToId);
        if (farmId is > 0) query = query.Where(t => t.FarmId == farmId);
        if (zoneId is > 0) query = query.Where(t => t.ZoneId == zoneId || t.Farm.ZoneId == zoneId);
        if (dueFrom is not null) query = query.Where(t => t.DueAt >= dueFrom);
        if (dueTo is not null) query = query.Where(t => t.DueAt <= dueTo);
        return (await query.OrderByDescending(t => t.CreatedAt).ThenByDescending(t => t.Id).ToPageAsync(page, size, ct)).Map(Summary);
    }

    public async Task<FieldTaskResponse> GetAsync(long id, CancellationToken ct = default) => Response(await RequireAsync(id, ct));

    /// <summary>Una tarea por cada finca seleccionada.</summary>
    public Task<List<FieldTaskResponse>> CreateAsync(CreateFieldTaskRequest r, long? createdById, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            if (r.FarmIds is null || r.FarmIds.Count == 0) throw new InvalidArgumentException("Debe seleccionar al menos una finca para la planificación.");
            var tasks = new List<FieldTask>();
            foreach (long farmId in r.FarmIds)
            {
                Farm farm = await _db.Farms.FirstOrDefaultAsync(f => f.Id == farmId, ct) ?? throw new InvalidArgumentException("Finca no encontrada: id=" + farmId);
                tasks.Add(new FieldTask
                {
                    Title = r.Title!.Trim(), FarmId = farm.Id, ZoneId = r.ZoneId ?? farm.ZoneId, Description = r.Description, Priority = r.Priority!,
                    Status = r.Status ?? FieldTaskStatus.PENDING, DueAt = r.DueAt, CreatedById = createdById, CreatedAt = _clock.Now,
                });
            }
            _db.FieldTasks.AddRange(tasks);
            await _db.SaveChangesAsync(ct);
            var ids = tasks.Select(t => t.Id).ToList();
            _db.ChangeTracker.Clear();
            return (await Full().AsNoTracking().Where(t => ids.Contains(t.Id)).OrderBy(t => t.Id).ToListAsync(ct)).Select(Response).ToList();
        }, ct);

    public Task<FieldTaskResponse> UpdateAsync(long id, UpdateFieldTaskRequest r, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            FieldTask task = await RequireAsync(id, ct);
            Farm farm = await _db.Farms.FirstOrDefaultAsync(f => f.Id == r.FarmId, ct) ?? throw new InvalidArgumentException("Finca no encontrada: id=" + r.FarmId);
            task.Title = r.Title!.Trim();
            task.FarmId = farm.Id;
            if (r.ZoneId is not null) task.ZoneId = r.ZoneId;
            else if (farm.ZoneId is not null) task.ZoneId = farm.ZoneId;
            task.Description = r.Description;
            task.Priority = r.Priority!;
            task.Status = r.Status!.Value;
            task.DueAt = r.DueAt;
            task.Farm = null!;
            task.Zone = null;
            await _db.SaveChangesAsync(ct);
            _db.ChangeTracker.Clear();
            return await GetAsync(id, ct);
        }, ct);

    public async Task<FieldTaskSummaryResponse> DeleteAsync(long id, CancellationToken ct = default)
    {
        FieldTask task = await RequireAsync(id, ct);
        var summary = Summary(task);
        _db.FieldTasks.Remove(task);
        await _db.SaveChangesAsync(ct);
        return summary;
    }

    /// <summary>Asignar una tarea crea su visita de campo y deja la tarea como ASSIGNED (una sola visita por tarea).</summary>
    public Task<FieldVisitSummaryResponse> AssignAsync(long taskId, AssignFieldTaskRequest r, long? assignedById, CancellationToken ct = default) =>
        _db.InTransactionAsync(async () =>
        {
            FieldTask task = (await _db.FieldTasks.FromSqlInterpolated($"SELECT * FROM field_tasks WHERE id = {taskId} FOR UPDATE").ToListAsync(ct)).FirstOrDefault()
                             ?? throw new InvalidArgumentException("Tarea no encontrada");
            if (task.CreatedFieldVisitId is not null) throw new BusinessRuleException("La tarea ya tiene una visita asignada.");
            long? farmZone = await _db.Farms.Where(f => f.Id == task.FarmId).Select(f => f.ZoneId).FirstAsync(ct);
            FieldVisitResponse visit = await _visits.CreateAsync(new CreateFieldVisitRequest
            {
                FarmId = task.FarmId, ZoneId = task.ZoneId ?? farmZone, FieldVetId = r.FieldVetId, VehicleId = r.VehicleId,
                ScheduledDateTime = r.ScheduledDateTime, Objective = r.Objective, CompanionIds = r.CompanionIds ?? new(),
            }, ct);
            task = await _db.FieldTasks.FirstAsync(t => t.Id == taskId, ct);
            task.AssignedToId = r.FieldVetId;
            task.Status = FieldTaskStatus.ASSIGNED;
            task.DueAt = r.ScheduledDateTime;
            task.CreatedFieldVisitId = visit.Id;
            task.ZoneId ??= farmZone;
            await _db.SaveChangesAsync(ct);
            return await _visits.SummaryAsync(visit.Id, ct);
        }, ct);
}

public interface IFieldRouteService
{
    Task<List<FieldRouteDayResponse>> ListByDateAsync(DateOnly date, CancellationToken ct = default);
    Task<FieldRouteDayResponse> CreateAsync(CreateFieldRouteDayRequest r, CancellationToken ct = default);
}

public sealed class FieldRouteService : IFieldRouteService
{
    private readonly TenantDbContext _db;
    public FieldRouteService(TenantDbContext db) => _db = db;

    private IQueryable<FieldRouteDay> Full() => _db.FieldRouteDays.Include(d => d.Employee).Include(d => d.Vehicle)
        .Include(d => d.Stops).ThenInclude(s => s.FieldVisit).ThenInclude(v => v.Farm);

    private static FieldRouteDayResponse Response(FieldRouteDay d) => new(d.Id, d.RouteDate, d.EmployeeId, d.Employee?.FullName, d.VehicleId,
        d.Vehicle?.Name, d.Stops.OrderBy(s => s.Position).Select(s => new FieldRouteStopResponse(s.Id, s.Position, s.FieldVisitId,
            s.FieldVisit?.Farm?.Name, s.Eta)).ToList());

    public async Task<List<FieldRouteDayResponse>> ListByDateAsync(DateOnly date, CancellationToken ct = default) =>
        (await Full().AsNoTracking().Where(d => d.RouteDate == date).OrderBy(d => d.Id).ToListAsync(ct)).Select(Response).ToList();

    public async Task<FieldRouteDayResponse> CreateAsync(CreateFieldRouteDayRequest r, CancellationToken ct = default)
    {
        var day = new FieldRouteDay { EmployeeId = r.EmployeeId!.Value, VehicleId = r.VehicleId, RouteDate = r.RouteDate!.Value };
        foreach (CreateFieldRouteStopRequest s in r.Stops ?? new())
            day.Stops.Add(new FieldRouteStop { RouteDay = day, FieldVisitId = s.FieldVisitId!.Value, Position = s.Position!.Value, Eta = s.Eta });
        _db.FieldRouteDays.Add(day);
        await _db.SaveChangesAsync(ct);
        _db.ChangeTracker.Clear();
        return Response(await Full().AsNoTracking().FirstAsync(d => d.Id == day.Id, ct));
    }
}

public interface ITeamStatusService
{
    Task<List<TeamStatusResponse>> ListAsync(CancellationToken ct = default);
    Task<TeamStatusResponse> SetAsync(SetTeamStatusRequest r, CancellationToken ct = default);
}

public sealed class TeamStatusService : ITeamStatusService
{
    private readonly TenantDbContext _db;
    public TeamStatusService(TenantDbContext db) => _db = db;

    private IQueryable<FieldTeamStatusEntity> Full() => _db.FieldTeamStatuses.Include(s => s.Employee)
        .Include(s => s.CurrentVisit!).ThenInclude(v => v.Farm!).ThenInclude(f => f.Zone)
        .Include(s => s.CurrentVisit!).ThenInclude(v => v.Zone);

    private static TeamStatusResponse Response(FieldTeamStatusEntity e)
    {
        FieldVisit? visit = e.CurrentVisit;
        Farm? farm = visit?.Farm;
        GeoZone? zone = visit is null ? null : visit.Zone ?? farm?.Zone;
        return new TeamStatusResponse(e.EmployeeId, e.Employee?.FullName, e.Status, visit?.Id, farm?.Id, farm?.Name, zone?.Id, zone?.Name,
            e.LocationText, e.GpsCoordinates);
    }

    public async Task<List<TeamStatusResponse>> ListAsync(CancellationToken ct = default) =>
        (await Full().AsNoTracking().OrderBy(s => s.Id).ToListAsync(ct)).Select(Response).ToList();

    public async Task<TeamStatusResponse> SetAsync(SetTeamStatusRequest r, CancellationToken ct = default)
    {
        FieldTeamStatusEntity? e = await _db.FieldTeamStatuses.FirstOrDefaultAsync(s => s.EmployeeId == r.EmployeeId, ct);
        if (e is null)
        {
            e = new FieldTeamStatusEntity { EmployeeId = r.EmployeeId!.Value };
            _db.FieldTeamStatuses.Add(e);
        }
        e.Status = r.Status!.Value;
        e.CurrentVisitId = r.CurrentVisitId;
        e.LocationText = r.LocationText;
        e.GpsCoordinates = r.GpsCoordinates;
        await _db.SaveChangesAsync(ct);
        _db.ChangeTracker.Clear();
        return Response(await Full().AsNoTracking().FirstAsync(s => s.Id == e.Id, ct));
    }
}
