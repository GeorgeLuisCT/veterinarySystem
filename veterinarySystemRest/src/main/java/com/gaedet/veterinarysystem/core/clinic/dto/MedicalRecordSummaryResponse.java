package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.MedicalRecordCategory;

import java.time.LocalDateTime;

public record MedicalRecordSummaryResponse(
        LocalDateTime occurredAt,
        MedicalRecordCategory category,
        String title
) {}