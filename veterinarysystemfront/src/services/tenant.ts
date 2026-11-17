/**
 * Empresa (tenant) con la que trabaja el navegador.
 *
 * El backend es multiempresa (un schema de PostgreSQL por empresa). Con sesión iniciada la empresa viaja en el JWT;
 * sin sesión (login y portal público) se indica con la cabecera X-Tenant. Orden de resolución:
 *   1. ?empresa= / ?company= en la URL (se recuerda para las siguientes visitas)
 *   2. la última empresa usada en este navegador
 *   3. NEXT_PUBLIC_TENANT (despliegue de una sola empresa)
 * Si no hay ninguna, el backend la deduce del subdominio o, si solo existe una empresa activa, usa esa.
 */
const STORAGE_KEY = "tenant";
const SLUG = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;

function normalize(value: string | null | undefined): string | null {
  const v = value?.trim().toLowerCase();
  return v && SLUG.test(v) ? v : null;
}

export function getTenant(): string | null {
  if (typeof window === "undefined") return normalize(process.env.NEXT_PUBLIC_TENANT);

  const params = new URLSearchParams(window.location.search);
  const fromUrl = normalize(params.get("empresa") ?? params.get("company"));
  if (fromUrl) {
    setTenant(fromUrl);
    return fromUrl;
  }

  try {
    const stored = normalize(window.localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // almacenamiento bloqueado (modo privado): se sigue con la configuración del despliegue
  }
  return normalize(process.env.NEXT_PUBLIC_TENANT);
}

export function setTenant(value: string | null | undefined): void {
  if (typeof window === "undefined") return;
  const slug = normalize(value);
  try {
    if (slug) window.localStorage.setItem(STORAGE_KEY, slug);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // sin almacenamiento: la empresa se volverá a indicar en la próxima visita
  }
}

export const isValidTenant = (value: string) => normalize(value) !== null;
