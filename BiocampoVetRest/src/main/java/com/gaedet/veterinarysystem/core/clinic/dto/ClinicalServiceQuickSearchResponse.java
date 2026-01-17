package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalServiceCategory;

import java.math.BigDecimal;

public record ClinicalServiceQuickSearchResponse(
        Long id,
        String name,
        ClinicalServiceCategory category,
        BigDecimal price
) {
    public static ClinicalServiceQuickSearchResponse fromNativeRow(Object[] row) {
        return new ClinicalServiceQuickSearchResponse(
                row[0] == null ? null : ((Number) row[0]).longValue(),
                (String) row[1],
                row[2] == null ? null : ClinicalServiceCategory.valueOf((String) row[2]),
                row[3] == null ? null : (BigDecimal) row[3]
        );
    }
}
