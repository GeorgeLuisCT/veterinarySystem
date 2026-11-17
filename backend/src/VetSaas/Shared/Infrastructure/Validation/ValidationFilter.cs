using FluentValidation;
using FluentValidation.Results;
using VetSaas.Shared.Application;

namespace VetSaas.Shared.Infrastructure.Validation;

/// <summary>
/// Valida el cuerpo de tipo <typeparamref name="T"/> con su validador de FluentValidation antes de ejecutar el endpoint.
/// Responde 400 con el primer mensaje, como hacía la validación del backend anterior.
/// </summary>
public sealed class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        T? body = context.Arguments.OfType<T>().FirstOrDefault();
        if (body is null)
            throw new BadRequestException("El cuerpo de la solicitud es inválido o tiene un formato/valor no permitido");

        IValidator<T>? validator = context.HttpContext.RequestServices.GetService<IValidator<T>>();
        if (validator is not null)
        {
            ValidationResult result = await validator.ValidateAsync(body, context.HttpContext.RequestAborted);
            if (!result.IsValid)
                throw new ValidationFailedException(result.Errors[0].ErrorMessage);
        }
        return await next(context);
    }
}

public static class ValidationExtensions
{
    /// <summary>Valida el cuerpo <typeparamref name="T"/> del endpoint (requiere un AbstractValidator&lt;T&gt; registrado).</summary>
    public static RouteHandlerBuilder Validate<T>(this RouteHandlerBuilder builder) where T : class =>
        builder.AddEndpointFilter<ValidationFilter<T>>();
}
