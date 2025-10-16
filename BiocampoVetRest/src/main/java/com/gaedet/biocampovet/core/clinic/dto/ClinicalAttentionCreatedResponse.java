package com.gaedet.biocampovet.core.clinic.dto;


import com.gaedet.biocampovet.core.clinic.enums.ClinicalAttentionStatus;

public record ClinicalAttentionCreatedResponse(
        Long animalId,
        Long attentionId,
        Long clinicalAttentionId,
        ClinicalAttentionStatus status
) {}
