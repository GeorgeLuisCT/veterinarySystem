package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.MedicalRecordCategory;

import java.time.LocalDateTime;

public record MedicalRecordSummaryResponse(
        LocalDateTime occurredAt,
        MedicalRecordCategory category,
        String title
) {}