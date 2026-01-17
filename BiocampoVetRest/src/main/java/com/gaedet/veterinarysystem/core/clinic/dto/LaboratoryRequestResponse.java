package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.LabRequestStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class LaboratoryRequestResponse {

    private final Long id;
    private final Long laboratoryId;
    private final String laboratoryName;
    private final Long requestingEmployeeId;
    private final String requestingEmployeeFullName;
    private final LabRequestStatus status;
    private final LocalDateTime createdAt;
    private final String clinicalNotes;
    private final List<LaboratoryRequestItemResponse> items;
}
