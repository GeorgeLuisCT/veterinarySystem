package com.gaedet.biocampovet.core.users.enums;

import lombok.Getter;

@Getter
public enum RoleName {
    ROLE_USER("Cliente"),
    ROLE_ADMIN("Administrador"),
    ROLE_VETERINARIAN("Veterinario"),
    ROLE_ASSISTANT("Asistente"),
    ROLE_RECEPTIONIST("Recepcionista"),
    ROLE_MANAGER("Gerente"),
    ROLE_GROOMER("Peluquero"),
    ROLE_SUPERVISOR("Supervisor"),
    ROLE_WAREHOUSE("Encargado"),
    ROLE_CASHIER("Cajero");

    private final String label;

    RoleName(String label) {
        this.label = label;
    }
}