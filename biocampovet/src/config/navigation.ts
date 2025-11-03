import {
  ShoppingCart,
  Boxes,
  Users,
  Stethoscope,
  CalendarDays,
  MapPin,
  PiggyBank,
  UserCog,
  BarChart3,
  Wallet,
  LayoutDashboard, // Nuevo icono
  Settings, // Nuevo icono
  BookHeart, // Nuevo icono
  Sofa, // Nuevo icono
  Hospital,
  Scissors, // Nuevo icono
} from "lucide-react";

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
      url: "/dashboard/crm",
      icon: Users,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_RECEPTIONIST", "ROLE_MANAGER", "ROLE_VETERINARIAN"],
      items: [
        { title: "Gestionar Clientes", url: "/dashboard/crm/customers", rolesAllowed: ["ROLE_RECEPTIONIST"] },
        { title: "Gestionar Pacientes", url: "/dashboard/crm/patients", rolesAllowed: ["ROLE_RECEPTIONIST", "ROLE_VETERINARIAN"] },
        { title: "Deudas", url: "/dashboard/crm/debts", rolesAllowed: ["ROLE_RECEPTIONIST", "ROLE_ADMIN"] },
      ],
    },

    // --- MÓDULO 2: CLÍNICO ---
    {
      title: "Módulo Clínico",
      url: "/dashboard/clinical",
      icon: Stethoscope,
      rolesAllowed: ["ROLE_VETERINARIAN", "ROLE_ASSISTANT", "ROLE_ADMIN"],
      items: [
        { title: "Historial Clínico", url: "/dashboard/clinical/medical-history", rolesAllowed: ["ROLE_VETERINARIAN"] },
        { title: "Consultorio", url: "/dashboard/clinical/consultory", rolesAllowed: ["ROLE_VETERINARIAN"] },
        { title: "Hospitalización", url: "/dashboard/clinical/hospitalization", icon: Hospital, rolesAllowed: ["ROLE_VETERINARIAN", "ROLE_ASSISTANT"] },
        { title: "Laboratorio", url: "/dashboard/clinical/laboratory", icon: Hospital, rolesAllowed: ["ROLE_VETERINARIAN", "ROLE_ASSISTANT"] },
        { title: "Quirófano", url: "/dashboard/clinical/operating-room", icon: Hospital, rolesAllowed: ["ROLE_VETERINARIAN", "ROLE_ASSISTANT"] },
        { title: "Catálogo Clínico", url: "/dashboard/clinical/catalog", icon: BookHeart, rolesAllowed: ["ROLE_ADMIN", "ROLE_VETERINARIAN"] },
      ],
    },

    // --- MÓDULO 3: OPERACIONES Y VENTAS ---
    {
      title: "Punto de Venta",
      url: "/dashboard/pos",
      icon: ShoppingCart,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_CASHIER", "ROLE_MANAGER", "ROLE_RECEPTIONIST"],
      items: [
        { title: "Nueva Venta", url: "/dashboard/pos/sales/new", rolesAllowed: ["ROLE_CASHIER", "ROLE_RECEPTIONIST"] },
        { title: "Historial de Ventas", url: "/dashboard/pos/sales/history", rolesAllowed: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      ],
    },
     {
      title: "Caja",
      url: "/dashboard/cashbox",
      icon: Wallet,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_CASHIER", "ROLE_MANAGER"],
      items: [
        { title: "Corte Actual", url: "/dashboard/cashbox/current", rolesAllowed: ["ROLE_CASHIER"] },
        { title: "Historial de Cierres", url: "/dashboard/cashbox/history", rolesAllowed: ["ROLE_ADMIN", "ROLE_MANAGER"] },
      ],
    },
    {
      title: "Inventario",
      url: "/dashboard/inventory",
      icon: Boxes,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_WAREHOUSE", "ROLE_MANAGER"],
      items: [
        { title: "Productos", url: "/dashboard/inventory/products", rolesAllowed: ["ROLE_WAREHOUSE"] },
        { title: "Proveedores", url: "/dashboard/inventory/suppliers", rolesAllowed: ["ROLE_WAREHOUSE", "ROLE_ADMIN"] },
        { title: "Compras", url: "/dashboard/inventory/movements/purchase", rolesAllowed: ["ROLE_ADMIN"] },
        { title: "Movimientos", url: "/dashboard/inventory/movements", rolesAllowed: ["ROLE_ADMIN", "ROLE_WAREHOUSE"] },
      ],
    },
    
    // --- MÓDULO 4: VETERINARIA DE CAMPO ---
    {
      title: "Veterinaria de Campo",
      url: "/dashboard/fieldwork",
      icon: MapPin,
      rolesAllowed: ["ROLE_VETERINARIAN", "ROLE_ADMIN"],
      items: [
        { title: "Calendario", url: "/dashboard/fieldwork/calendar", rolesAllowed: ["ROLE_VETERINARIAN"] },
        { title: "Visitas a Granjas", url: "/dashboard/fieldwork/visits", rolesAllowed: ["ROLE_VETERINARIAN"] },
        { title: "Gestión de Insumos", url: "/dashboard/fieldwork/supplies", rolesAllowed: ["ROLE_ADMIN", "ROLE_VETERINARIAN"] },
        { title: "Centro de Control", url: "/dashboard/fieldwork/control-center", rolesAllowed: ["ROLE_VETERINARIAN"] },
        { title: "Gestión de Granjas", url: "/dashboard/fieldwork/farms", rolesAllowed: ["ROLE_ADMIN", "ROLE_VETERINARIAN"] },
      ],
    },
    {
      title: "Peluquería",
      url: "/dashboard/grooming",
      icon: Scissors,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_GROOMER", "ROLE_MANAGER"],
      items: []
    }
  ],

  // --- SECCIÓN DE ADMINISTRACIÓN (ANTES "PROJECTS") ---
  projects: [
    {
      title: "Dashboard",
      url: "/dashboard/overview",
      icon: LayoutDashboard,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_MANAGER"],
    },
    {
      title: "Reportes",
      url: "/dashboard/reports",
      icon: BarChart3,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_MANAGER"],
      items: [
        { title: "Financieros", url: "/dashboard/reports/financial", rolesAllowed: ["ROLE_ADMIN"] },
        { title: "Ventas", url: "/dashboard/reports/sales", rolesAllowed: ["ROLE_ADMIN", "ROLE_MANAGER"] },
        { title: "Inventario", url: "/dashboard/reports/inventory", rolesAllowed: ["ROLE_ADMIN"] },
        { title: "Clínicos", url: "/dashboard/reports/clinical", rolesAllowed: ["ROLE_ADMIN"] },
      ],
    },
    {
      title: "Finanzas",
      url: "/dashboard/finance",
      icon: PiggyBank,
      rolesAllowed: ["ROLE_ADMIN"],
      items: [
        { title: "Ingresos y Egresos", url: "/dashboard/finance/transactions", rolesAllowed: ["ROLE_ADMIN"] },
        { title: "Cuentas Bancarias", url: "/dashboard/finance/accounts", rolesAllowed: ["ROLE_ADMIN"] },
      ],
    },
     {
      title: "Personal",
      url: "/dashboard/staff",
      icon: UserCog,
      rolesAllowed: ["ROLE_ADMIN", "ROLE_MANAGER"],
      items: [
        { title: "Gestionar Empleados", url: "/dashboard/staff/employees", rolesAllowed: ["ROLE_MANAGER"] },
        { title: "Turnos y Horarios", url: "/dashboard/staff/shifts", rolesAllowed: ["ROLE_MANAGER"] },
      ],
    },
    {
      title: "Configuración",
      url: "/dashboard/settings",
      icon: Settings,
      rolesAllowed: ["ROLE_ADMIN"],
      items: [
        { title: "Mi Clínica / Sucursales", url: "/dashboard/settings/branches", rolesAllowed: ["ROLE_ADMIN"] },
        { title: "Usuarios y Roles", url: "/dashboard/settings/security", rolesAllowed: ["ROLE_ADMIN"] },
        { title: "Plantillas", url: "/dashboard/settings/templates", rolesAllowed: ["ROLE_ADMIN"] },
        { title: "Auditoría", url: "/dashboard/settings/audit", rolesAllowed: ["ROLE_ADMIN"] },
      ],
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
