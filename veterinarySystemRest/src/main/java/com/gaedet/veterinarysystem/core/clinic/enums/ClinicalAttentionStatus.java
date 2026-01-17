package com.gaedet.veterinarysystem.core.clinic.enums;

import lombok.Getter;

@Getter
public enum ClinicalAttentionStatus {
    OPEN("Abierta"),
    IN_PROGRESS("En progreso"),
    WAITING_LAB("Esperando a laboratorio"),
    READY_TO_BILL("Listo para facturar"),
    CLOSED("Cerrada"),
    CANCELED("Cancelada");

    private final String label;

    ClinicalAttentionStatus(String label) {
        this.label = label;
    }
}


