import {
  BookHeart,
  Building2,
  Car,
  Cog,
  Fence,
  ListTree,
  HeartPulse,
  MapPinned,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Store,
  Tags,
  Truck,
  UserCog,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

/**
 * SECCIÓN CONFIGURACIÓN: catálogos y ajustes de la empresa, agrupados por tema (como en el hotel).
 * La página /dashboard/settings, el breadcrumb y la visibilidad por rol salen de aquí. Para agregar una opción: una línea en su grupo.
 */
export interface SettingsItem {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  /** Basta con tener uno de estos roles para verla; vacío = todos. */
  roles: string[];
  /** Palabras extra para el buscador. */
  keywords?: string;
  /** Aún no existe: se muestra atenuada con «Próximamente», sin enlace. */
  soon?: boolean;
}

export interface SettingsGroup {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Clases del cuadro del ícono de las tarjetas del grupo. */
  tile: string;
  items: SettingsItem[];
}

export const SETTINGS_URL = "/dashboard/settings";

const ADMIN = "ROLE_ADMIN";
const MANAGER = "ROLE_MANAGER";
const VET = "ROLE_VETERINARIAN";
const WAREHOUSE = "ROLE_WAREHOUSE";

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: "Empresa",
    subtitle: "Quién es tu veterinaria y quién la usa",
    icon: Building2,
    tile: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    items: [
      { href: `${SETTINGS_URL}/users`, icon: ShieldCheck, label: "Usuarios", description: "Quién entra al sistema, con qué roles y en qué sucursales.", roles: [ADMIN], keywords: "cuentas accesos roles contraseña seguridad" },
      { href: `${SETTINGS_URL}/staff`, icon: UserCog, label: "Personal", description: "Directorio de empleados: cargo, contacto y sucursales.", roles: [ADMIN, MANAGER], keywords: "empleados trabajadores veterinarios" },
      { href: `${SETTINGS_URL}/branches`, icon: Store, label: "Sucursales", description: "Dirección de cada sede, sus laboratorios y quirófanos.", roles: [ADMIN], keywords: "sede laboratorio quirófano", soon: true },
      { href: `${SETTINGS_URL}/company`, icon: Building2, label: "Datos de la empresa", description: "Nombre comercial y rubro que se muestran en el portal.", roles: [ADMIN], keywords: "razón social ruc nombre", soon: true },
    ],
  },
  {
    title: "Clínica",
    subtitle: "Lo que ofreces y con qué atiendes",
    icon: Stethoscope,
    tile: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    items: [
      { href: `${SETTINGS_URL}/clinical-catalog`, icon: BookHeart, label: "Catálogo clínico", description: "Servicios y procedimientos, pruebas de laboratorio y plantillas de receta.", roles: [ADMIN, MANAGER, VET], keywords: "servicios precios exámenes laboratorio recetas plantillas" },
      { href: `${SETTINGS_URL}/health-plans`, icon: HeartPulse, label: "Planes de salud", description: "Paquetes de servicios con precio que ofreces a tus clientes.", roles: [ADMIN, MANAGER, VET], keywords: "paquetes vacunación desparasitación preventivo" },
      { href: `${SETTINGS_URL}/cages`, icon: Fence, label: "Jaulas", description: "Las jaulas de hospitalización de cada sucursal y su tamaño.", roles: [ADMIN, MANAGER, VET], keywords: "hospitalización internamiento" },
    ],
  },
  {
    title: "Inventario",
    subtitle: "Cómo se ordenan tus productos y a quién compras",
    icon: Warehouse,
    tile: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    items: [
      { href: `${SETTINGS_URL}/product-categories`, icon: Tags, label: "Categorías de productos", description: "Las categorías con las que se agrupan y filtran los productos.", roles: [ADMIN, MANAGER, WAREHOUSE], keywords: "productos clasificación" },
      { href: `${SETTINGS_URL}/suppliers`, icon: Truck, label: "Proveedores", description: "A quién le compras: datos de contacto y documento.", roles: [ADMIN, MANAGER, WAREHOUSE], keywords: "compras distribuidores" },
    ],
  },
  {
    title: "Veterinaria de campo",
    subtitle: "Dónde trabajas y con qué te movilizas",
    icon: MapPinned,
    tile: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    items: [
      { href: `${SETTINGS_URL}/geo-zones`, icon: MapPinned, label: "Zonas geográficas", description: "Regiones, provincias, distritos y sectores donde están las granjas.", roles: [ADMIN, MANAGER, VET], keywords: "región provincia distrito sector" },
      { href: `${SETTINGS_URL}/vehicles`, icon: Car, label: "Vehículos", description: "Las unidades móviles, su placa, responsable y sucursal.", roles: [ADMIN, MANAGER, VET], keywords: "camioneta movilidad placa" },
    ],
  },
  {
    title: "Sistema",
    subtitle: "Cómo se ve y se comporta la aplicación",
    icon: Cog,
    tile: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    items: [
      { href: `${SETTINGS_URL}/catalogs`, icon: ListTree, label: "Catálogos", description: "Listas que se ofrecen al registrar: especies, vías de administración, presentaciones, unidades…", roles: [ADMIN, MANAGER], keywords: "listas opciones especies vías presentaciones unidades tipos valores enums" },
      { href: `${SETTINGS_URL}/preferences`, icon: SlidersHorizontal, label: "Preferencias", description: "Letra, pantalla de inicio, duración de citas, menú y cierre por inactividad.", roles: [], keywords: "preferencias ajustes tema letra inicio menú inactividad personalizar" },
    ],
  },
];

export const canSee = (item: Pick<SettingsItem, "roles">, roles: string[]) =>
  item.roles.length === 0 || item.roles.some((r) => roles.includes(r));
