FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Solución y proyecto primero para cachear la restauración de paquetes
COPY VetSaas.sln ./
COPY src/VetSaas/VetSaas.csproj src/VetSaas/
RUN dotnet restore src/VetSaas/VetSaas.csproj

COPY . .
RUN dotnet publish src/VetSaas/VetSaas.csproj -c Release -o /publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080 \
    TZ=America/Lima
COPY --from=build /publish .
EXPOSE 8080
# Al arrancar aplica las migraciones de la plataforma y de todos los schemas de empresa (t_<slug>).
ENTRYPOINT ["dotnet", "VetSaas.dll"]
