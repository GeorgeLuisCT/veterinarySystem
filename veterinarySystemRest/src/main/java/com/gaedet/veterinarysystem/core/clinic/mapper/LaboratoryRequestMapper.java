package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.clinic.dto.LaboratoryRequestDetailResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.LaboratoryRequestItemResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.LaboratoryRequestSummaryResponse;

import java.util.stream.Collectors;

public final class LaboratoryRequestMapper {

    public static LaboratoryRequestDetailResponse fromEntity(com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryRequest entity) {
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
