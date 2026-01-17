package com.gaedet.veterinarysystem.core.clinic.enums;

import lombok.Getter;

@Getter
public enum LabRequestStatus {
    REQUESTED,
    IN_PROGRESS,
    COMPLETED,
    CANCELED
}
