package com.gaedet.veterinarysystem.core.clinic.dto;


import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalAttentionStatus;

public record ClinicalAttentionCreatedResponse(
        Long animalId,
        Long attentionId,
        Long clinicalAttentionId,
        ClinicalAttentionStatus status
) {}
