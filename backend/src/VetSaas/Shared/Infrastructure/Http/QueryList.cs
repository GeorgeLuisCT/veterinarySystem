using System.Reflection;
using Microsoft.Extensions.Primitives;
using VetSaas.Shared.Application;

namespace VetSaas.Shared.Infrastructure.Http;

/// <summary>
/// Lista en la query string con las mismas formas que aceptaba Spring: «a,b», «x=a&amp;x=b» y también «x[]=a».
/// Si el parámetro no viene, la lista es null.
/// </summary>
public sealed class QueryList<T> : List<T>
{
    public static ValueTask<QueryList<T>?> BindAsync(HttpContext context, ParameterInfo parameter)
    {
        string name = parameter.Name!;
        StringValues values = context.Request.Query[name];
        if (values.Count == 0) values = context.Request.Query[name + "[]"];
        if (values.Count == 0) return ValueTask.FromResult<QueryList<T>?>(null);

        var list = new QueryList<T>();
        foreach (string? raw in values)
        foreach (string item in (raw ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            list.Add(Parse(item, name));
        return ValueTask.FromResult<QueryList<T>?>(list);
    }

    private static T Parse(string value, string name)
    {
        Type type = Nullable.GetUnderlyingType(typeof(T)) ?? typeof(T);
        try
        {
            if (type.IsEnum) return (T)Enum.Parse(type, value, ignoreCase: false);
            return (T)Convert.ChangeType(value, type, System.Globalization.CultureInfo.InvariantCulture);
        }
        catch (Exception ex) when (ex is ArgumentException or FormatException or InvalidCastException or OverflowException)
        {
            throw new BadRequestException($"Falta un parámetro requerido o tiene un valor inválido ({name})");
        }
    }
}
