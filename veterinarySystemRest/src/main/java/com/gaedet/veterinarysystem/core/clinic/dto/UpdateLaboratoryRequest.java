package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.LabRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.openapitools.jackson.nullable.JsonNullable;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLaboratoryRequest {
    private Long version;
    private JsonNullable<LabRequestStatus> status;
    private JsonNullable<String> clinicalNotes;
}
