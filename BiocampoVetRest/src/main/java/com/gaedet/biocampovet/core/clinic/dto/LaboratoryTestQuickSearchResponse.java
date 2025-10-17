package com.gaedet.biocampovet.core.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaboratoryTestQuickSearchResponse {
    private Long id;
    private String code;
    private String name;
    private BigDecimal price;

    public static LaboratoryTestQuickSearchResponse fromNativeRow(Object[] row) {
        return LaboratoryTestQuickSearchResponse.builder()
                .id(((Number) row[0]).longValue())
                .code((String) row[1])
                .name((String) row[2])
                .price((BigDecimal) row[3])
                .build();
    }
}
