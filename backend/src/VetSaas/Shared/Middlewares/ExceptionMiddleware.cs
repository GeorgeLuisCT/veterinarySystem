using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using VetSaas.Shared.Application;
using VetSaas.Shared.Infrastructure.Json;

namespace VetSaas.Shared.Middlewares;

/// <summary>
/// Traduce las excepciones a respuestas HTTP coherentes: {"error": ..., "message": ...}.
/// Los errores del cliente (4xx) se registran como advertencia sin traza; solo los 5xx llevan la traza completa.
/// </summary>
public sealed class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception) when (!context.Response.HasStarted)
        {
            (int status, string error, string message) = Translate(exception);
            if (status >= 500) _logger.LogError(exception, "Error inesperado");
            else _logger.LogWarning("{Error} ({Status}): {Message}", error, status, exception.Message);

            context.Response.Clear();
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsync(JsonSerializer.Serialize(new ErrorBody(error, message), JsonSetup.Options));
        }
    }

    public sealed record ErrorBody(string Error, string Message);

    public static (int Status, string Error, string Message) Translate(Exception exception) => exception switch
    {
        ApiException api => (api.StatusCode, api.Title, api.ClientMessage),
        BadHttpRequestException or JsonException => (400, "Solicitud incorrecta",
            "El cuerpo de la solicitud es inválido o tiene un formato/valor no permitido"),
        DbUpdateConcurrencyException => (409, "Conflicto de concurrencia",
            "El registro fue modificado por otro usuario al mismo tiempo. Actualiza e intenta nuevamente"),
        DbUpdateException { InnerException: PostgresException { SqlState: "40001" or "40P01" or "55P03" } } => (409,
            "Conflicto de concurrencia",
            "El registro fue modificado por otro usuario al mismo tiempo. Actualiza e intenta nuevamente"),
        PostgresException { SqlState: "40001" or "40P01" or "55P03" } => (409, "Conflicto de concurrencia",
            "El registro fue modificado por otro usuario al mismo tiempo. Actualiza e intenta nuevamente"),
        // 23xxx: violación de integridad (duplicado, referencia inexistente, registro aún referenciado).
        DbUpdateException { InnerException: PostgresException { SqlState: { } state } } when state.StartsWith("23", StringComparison.Ordinal)
            => (409, "Conflicto de datos",
                "Uno o más valores violan restricciones de la base de datos (duplicado o referencia inexistente)"),
        OperationCanceledException => (499, "Solicitud cancelada", "La solicitud fue cancelada"),
        _ => (500, "Error interno", "Ha ocurrido un error inesperado. Intenta nuevamente más tarde.")
    };
}
