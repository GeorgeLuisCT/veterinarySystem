using Microsoft.EntityFrameworkCore;

namespace VetSaas.Shared.Application;

/// <summary>Página de resultados con el mismo contrato que consume el frontend.</summary>
public sealed record PaginatedResponse<T>(
    IReadOnlyList<T> Content,
    int TotalPages,
    long TotalElements,
    int CurrentPage,
    int PageSize)
{
    public static PaginatedResponse<T> Of(IReadOnlyList<T> content, long total, int page, int size) =>
        new(content, size <= 0 ? 0 : (int)Math.Ceiling(total / (double)size), total, page, size);

    public PaginatedResponse<TOut> Map<TOut>(Func<T, TOut> map) =>
        new(Content.Select(map).ToList(), TotalPages, TotalElements, CurrentPage, PageSize);
}

public sealed record MessageResponse(string Message);

public static class PagingExtensions
{
    /// <summary>Cuenta y trae la página pedida (page base 0). La consulta debe venir ya ordenada.</summary>
    public static async Task<PaginatedResponse<T>> ToPageAsync<T>(this IQueryable<T> query, int page, int size,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 0);
        size = Math.Max(size, 1);
        long total = await query.LongCountAsync(ct);
        List<T> content = await query.Skip(page * size).Take(size).ToListAsync(ct);
        return PaginatedResponse<T>.Of(content, total, page, size);
    }
}
