import {
  ShoppingCart,
  Boxes,
  Users,
  Stethoscope,
  CalendarDays,
  MapPin,
  PiggyBank,
  Settings,
  BarChart3,
  Wallet,
  Hospital,
  Scissors,
} from "lucide-react";
import { RoleName } from "@/enums/role-name";
import { SETTINGS_GROUPS, SETTINGS_URL } from "@/config/settings";

export const navigationConfig = {
  // La información de usuario y equipos se mantiene igual
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    { name: "ViocampoVet", logo: ShoppingCart, plan: "Enterprise" },
    { name: "Acme Corp.", logo: Boxes, plan: "Startup" },
    { name: "Evil Corp.", logo: Users, plan: "Free" },
  ],

  // --- ESTRUCTURA DE NAVEGACIÓN REORGANIZADA ---
  navMain: [
    // --- MÓDULO 1: RECEPCIÓN Y AGENDA ---
    {
      title: "Agenda",
      key: "schedule",
      url: "/dashboard/schedule",
      icon: CalendarDays,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_RECEPTIONIST", "ROLE_MANAGER", "ROLE_VETERINARIAN"],
      items: [
        { title: "Calendario", url: "/dashboard/schedule/calendar", rolesAllowed: ["ROLE_RECEPTIONIST", "ROLE_VETERINARIAN"] },
        { title: "Recepción", url: "/dashboard/schedule/attentions", rolesAllowed: ["ROLE_RECEPTIONIST"] },
        { title: "Recordatorios", url: "/dashboard/schedule/reminders", rolesAllowed: ["ROLE_RECEPTIONIST", "ROLE_ADMIN"] },
      ],
    },
    {
      title: "Clientes y Pacientes",
      key: "crm",
      url: "/dashboard/crm",
      icon: Users,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_RECEPTIONIST", "ROLE_MANAGER", "ROLE_VETERINARIAN"],
      items: [
        { title: "Gestionar Clientes", url: "/dashboard/crm/customers", rolesAllowed: ["ROLE_RECEPTIONIST"] },
        { title: "Gestionar Pacientes", url: "/dashboard/crm/patients", rolesAllowed: ["ROLE_RECEPTIONIST", "ROLE_VETERINARIAN"] },
      ],
    },

    // --- MÓDULO 2: CLÍNICO ---
    {
      title: "Módulo Clínico",
      key: "clinical",
      url: "/dashboard/clinical",
      icon: Stethoscope,
      rolesAllowed: ["ROLE_VETERINARIAN", "ROLE_ASSISTANT", "ROLE_ADMIN"],
      items: [
        { title: "Historial Clínico", url: "/dashboard/clinical/medical-history", rolesAllowed: ["ROLE_VETERINARIAN"] },
        { title: "Consultorio", url: "/dashboard/clinical/consultory", rolesAllowed: ["ROLE_VETERINARIAN"] },
        { title: "Hospitalización", url: "/dashboard/clinical/hospitalization", icon: Hospital, rolesAllowed: ["ROLE_VETERINARIAN", "ROLE_ASSISTANT"] },
        { title: "Laboratorio", url: "/dashboard/clinical/laboratory", icon: Hospital, rolesAllowed: ["ROLE_VETERINARIAN", "ROLE_ASSISTANT"] },
        { title: "Quirófano", url: "/dashboard/clinical/operating-room", icon: Hospital, rolesAllowed: ["ROLE_VETERINARIAN", "ROLE_ASSISTANT"] },
      ],
    },

    // --- MÓDULO 3: OPERACIONES Y VENTAS ---
    {
      title: "Punto de Venta",
      key: "pos",
      url: "/dashboard/pos",
      icon: ShoppingCart,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_CASHIER", "ROLE_MANAGER", "ROLE_RECEPTIONIST"],
      items: [
        { title: "Nueva Venta", url: "/dashboard/pos/sales/new", rolesAllowed: ["ROLE_CASHIER", "ROLE_RECEPTIONIST"] },
        { title: "Historial De Ventas", url: "/dashboard/pos/sales/history", rolesAllowed: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      ],
    },
    {
      title: "Caja",
      key: "cashbox",
      url: "/dashboard/cashbox",
      icon: Wallet,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_CASHIER", "ROLE_MANAGER"],
      items: [
        { title: "Corte Actual", url: "/dashboard/cashbox/current", rolesAllowed: ["ROLE_CASHIER"] },
        { title: "Historial De Cierres", url: "/dashboard/cashbox/history", rolesAllowed: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      ],
    },
    {
      title: "Inventario",
      key: "inventory",
      url: "/dashboard/inventory",
      icon: Boxes,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_WAREHOUSE", "ROLE_MANAGER"],
      items: [
        { title: "Productos", url: "/dashboard/inventory/products", rolesAllowed: ["ROLE_WAREHOUSE"] },
        { title: "Compras", url: "/dashboard/inventory/movements/purchase", rolesAllowed: ["ROLE_ADMIN"] },
        { title: "Movimientos", url: "/dashboard/inventory/movements", rolesAllowed: ["ROLE_ADMIN", "ROLE_WAREHOUSE"] },
      ],
    },

    // --- MÓDULO 4: VETERINARIA DE CAMPO ---
    {
      title: "Veterinaria de Campo",
      key: "fieldwork",
      url: "/dashboard/fieldwork",
      icon: MapPin,
      rolesAllowed: ["ROLE_VETERINARIAN", "ROLE_ADMIN"],
      items: [
        { title: "Calendario", url: "/dashboard/fieldwork/calendar", rolesAllowed: ["ROLE_VETERINARIAN"] },
        { title: "Visitas a Granjas", url: "/dashboard/fieldwork/visits", rolesAllowed: ["ROLE_VETERINARIAN"] },
        { title: "Gestión de Insumos", url: "/dashboard/fieldwork/supplies", rolesAllowed: ["ROLE_ADMIN", "ROLE_VETERINARIAN"] },
        { title: "Centro de Control", url: "/dashboard/fieldwork/control-center", rolesAllowed: ["ROLE_VETERINARIAN"] },
        { title: "Granjas", url: "/dashboard/fieldwork/farms", rolesAllowed: ["ROLE_ADMIN", "ROLE_VETERINARIAN"] },
      ],
    },
    {
      title: "Peluquería",
      key: "grooming",
      url: "/dashboard/grooming",
      icon: Scissors,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_GROOMER", "ROLE_MANAGER"],
      items: []
    }
  ],

  // --- SECCIÓN DE ADMINISTRACIÓN (ANTES "PROJECTS") ---
  projects: [
    {
      title: "Reportes",
      key: "reports",
      url: "/dashboard/reports",
      icon: BarChart3,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_MANAGER"],
      items: [],
    },
    {
      title: "Finanzas",
      key: "finance",
      url: "/dashboard/finance",
      icon: PiggyBank,
      rolesAllowed: ["ROLE_ADMIN"],
      items: [
        { title: "Tesorería", url: "/dashboard/finance/finance", rolesAllowed: ["ROLE_ADMIN"] },
        { title: "Cuentas por Pagar", url: "/dashboard/finance/payable", rolesAllowed: ["ROLE_ADMIN"] },
      ],
    },
    // Catálogos y ajustes: cada tarjeta de la página filtra por rol; «Preferencias» la ve todo el mundo.
    {
      key: "settings",
      title: "Configuración",
      url: "/dashboard/settings",
      icon: Settings,
      rolesAllowed: Object.values(RoleName) as string[],
      items: [],
    },
  ],
};

// El breadcrumbMap se actualiza automáticamente con la nueva estructura
export const breadcrumbMap: Record<string, { title: string; subtitle?: string }> =
  [...navigationConfig.navMain, ...navigationConfig.projects].reduce((acc, section) => {
    if (section.url) acc[section.url] = { title: section.title };
    section.items?.forEach(item => {
      if (item.url) acc[item.url] = { title: section.title, subtitle: item.title };
    });
    return acc;
  }, {} as Record<string, { title: string; subtitle?: string }>);

// Las pantallas de Configuración no van en el menú (se entra por su página), pero sí en el breadcrumb.
SETTINGS_GROUPS.flatMap((g) => g.items).forEach((item) => {
  breadcrumbMap[item.href] = { title: "Configuración", subtitle: item.label };
});
breadcrumbMap[SETTINGS_URL] = { title: "Configuración" };
