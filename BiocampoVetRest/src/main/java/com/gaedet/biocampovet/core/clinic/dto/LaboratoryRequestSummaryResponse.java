package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.entity.LaboratoryRequest;
import com.gaedet.biocampovet.core.clinic.enums.LabRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class LaboratoryRequestSummaryResponse {
    private Long id;
    private Long animalId;
    private String animalName;
    private Long laboratoryId;
    private String laboratoryName;
    private Long requestingEmployeeId;
    private String requestingEmployeeFullName;
    private LabRequestStatus status;
    private LocalDateTime createdAt;

    public static LaboratoryRequestSummaryResponse fromEntity(LaboratoryRequest entity) {
        return LaboratoryRequestSummaryResponse.builder()
                .id(entity.getId())
                .animalId(entity.getAnimal().getId())
                .animalName(entity.getAnimal().getName())
                .laboratoryId(entity.getLaboratory().getId())
                .laboratoryName(entity.getLaboratory().getName())
                .requestingEmployeeId(entity.getRequestingEmployee() != null ? entity.getRequestingEmployee().getId() : null)
                .requestingEmployeeFullName(entity.getRequestingEmployee() != null ? entity.getRequestingEmployee().getFirstName() + " " + entity.getRequestingEmployee().getLastName() : null)
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
