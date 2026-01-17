package com.gaedet.veterinarysystem.core.clinic.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ClinicalAppointmentDetailResponse {
    private final Long clinicalServiceId;
    private final String clinicalServiceName;
    private final Long veterinarianId;
    private final String veterinarianFullName;
    private final String consultationReason;
    private final String clinicalNotes;
}
