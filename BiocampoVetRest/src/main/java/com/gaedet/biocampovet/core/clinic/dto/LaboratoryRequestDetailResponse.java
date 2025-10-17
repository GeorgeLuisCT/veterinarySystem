package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.entity.LaboratoryRequest;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class LaboratoryRequestDetailResponse extends LaboratoryRequestSummaryResponse {
    private String clinicalNotes;
    private List<LaboratoryRequestItemResponse> items;

    public static LaboratoryRequestDetailResponse fromEntity(LaboratoryRequest entity) {
        LaboratoryRequestSummaryResponse summary = LaboratoryRequestSummaryResponse.fromEntity(entity);
        return LaboratoryRequestDetailResponse.builder()
                .id(summary.getId())
                .animalId(summary.getAnimalId())
                .animalName(summary.getAnimalName())
                .laboratoryId(summary.getLaboratoryId())
                .laboratoryName(summary.getLaboratoryName())
                .requestingEmployeeId(summary.getRequestingEmployeeId())
                .requestingEmployeeFullName(summary.getRequestingEmployeeFullName())
                .status(summary.getStatus())
                .createdAt(summary.getCreatedAt())
                .clinicalNotes(entity.getClinicalNotes())
                .items(entity.getItems().stream().map(LaboratoryRequestItemResponse::fromEntity).collect(Collectors.toList()))
                .build();
    }
}
