package com.gaedet.biocampovet.core.clinic.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GroomingAppointmentDetailResponse {
    private final Long clinicalServiceId;
    private final String clinicalServiceName;
    private final Long stylistId;
    private final String stylistFullName;
    private final String ownerSpecialNotes;
}
