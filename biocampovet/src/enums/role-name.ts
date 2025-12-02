export enum RoleName {
    ROLE_USER = "ROLE_USER",         // Cliente que lleva a su mascota
    ROLE_ADMIN = "ROLE_ADMIN",       // Administrador del sistema
    ROLE_VETERINARIAN = "ROLE_VETERINARIAN", // Veterinario encargado de consultas
    ROLE_ASSISTANT = "ROLE_ASSISTANT",    // Asistente del veterinario
    ROLE_RECEPTIONIST = "ROLE_RECEPTIONIST", // Recepcionista que gestiona citas y pagos
    ROLE_MANAGER = "ROLE_MANAGER",      // Gerente de la veterinaria
    ROLE_GROOMER = "ROLE_GROOMER",      // Peluquero de mascotas
    ROLE_SUPERVISOR = "ROLE_SUPERVISOR",   // Supervisor con permisos intermedios
    ROLE_WAREHOUSE = "ROLE_WAREHOUSE",    // Encargado del almacén
    ROLE_CASHIER = "ROLE_CASHIER"       // Cajero encargado de ventas y pagos
}

export const getRoleLabel = (role: RoleName): string => {
    switch (role) {
        case RoleName.ROLE_USER:
            return "Cliente";
        case RoleName.ROLE_ADMIN:
            return "Administrador";
        case RoleName.ROLE_VETERINARIAN:
            return "Veterinario";
        case RoleName.ROLE_ASSISTANT:
            return "Asistente";
        case RoleName.ROLE_RECEPTIONIST:
            return "Recepcionista";
        case RoleName.ROLE_MANAGER:
            return "Gerente";
        case RoleName.ROLE_GROOMER:
            return "Peluquero";
        case RoleName.ROLE_SUPERVISOR:
            return "Supervisor";
        case RoleName.ROLE_WAREHOUSE:
            return "Encargado de Almacén";
        case RoleName.ROLE_CASHIER:
            return "Cajero";
        default:
            return "Rol Desconocido";
    }
};