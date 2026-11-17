namespace VetSaas.Shared.Application;

/// <summary>Excepción de negocio con el estado HTTP y el título que verá el cliente: {"error": Title, "message": Message}.</summary>
public abstract class ApiException : Exception
{
    protected ApiException(string message) : base(message) { }
    public abstract int StatusCode { get; }
    public abstract string Title { get; }
    /// <summary>Mensaje que se envía al cliente (por omisión, el de la excepción).</summary>
    public virtual string ClientMessage => Message;
}

/// <summary>400 — la solicitud es inválida.</summary>
public class BadRequestException : ApiException
{
    public BadRequestException(string message) : base(message) { }
    public override int StatusCode => StatusCodes.Status400BadRequest;
    public override string Title => "Solicitud incorrecta";
}

/// <summary>400 — un argumento no es válido (equivale a IllegalArgumentException del backend anterior).</summary>
public class InvalidArgumentException : ApiException
{
    public InvalidArgumentException(string message) : base(message) { }
    public override int StatusCode => StatusCodes.Status400BadRequest;
    public override string Title => "Argumento inválido";
}

/// <summary>400 — validación de datos de entrada.</summary>
public class ValidationFailedException : ApiException
{
    public ValidationFailedException(string message) : base(message) { }
    public override int StatusCode => StatusCodes.Status400BadRequest;
    public override string Title => "Validación fallida";
}

/// <summary>400 — no hay stock suficiente para la operación.</summary>
public class InsufficientStockException : ApiException
{
    public InsufficientStockException(string message) : base(message) { }
    public override int StatusCode => StatusCodes.Status400BadRequest;
    public override string Title => "Stock insuficiente";
}

/// <summary>401 — credenciales inválidas o usuario desactivado.</summary>
public class UnauthorizedException : ApiException
{
    public UnauthorizedException(string message) : base(message) { }
    public override int StatusCode => StatusCodes.Status401Unauthorized;
    public override string Title => "No autorizado";
}

/// <summary>403 — autenticado pero sin permiso. El cliente recibe siempre el mismo mensaje genérico.</summary>
public class ForbiddenException : ApiException
{
    public const string GenericMessage = "No tienes permisos para realizar esta acción";
    public ForbiddenException(string message = GenericMessage) : base(message) { }
    public override int StatusCode => StatusCodes.Status403Forbidden;
    public override string Title => "Acceso denegado";
    public override string ClientMessage => GenericMessage;
}

/// <summary>404 — el recurso no existe (en la empresa actual).</summary>
public class NotFoundException : ApiException
{
    public NotFoundException(string message) : base(message) { }
    public override int StatusCode => StatusCodes.Status404NotFound;
    public override string Title => "Recurso no encontrado";
}

/// <summary>409 — regla de negocio que depende del estado actual (equivale a IllegalStateException del backend anterior).</summary>
public class BusinessRuleException : ApiException
{
    public BusinessRuleException(string message) : base(message) { }
    public override int StatusCode => StatusCodes.Status409Conflict;
    public override string Title => "Operación no permitida";
}

/// <summary>Estado HTTP arbitrario con motivo (equivale a ResponseStatusException).</summary>
public class StatusException : ApiException
{
    private readonly int _status;
    public StatusException(int status, string reason) : base(reason) => _status = status;
    public override int StatusCode => _status;
    public override string Title => Message;
}
