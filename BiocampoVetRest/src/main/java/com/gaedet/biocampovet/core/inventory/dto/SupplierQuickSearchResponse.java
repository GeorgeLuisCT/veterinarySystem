package com.gaedet.biocampovet.core.inventory.dto;

public record SupplierQuickSearchResponse(
        Long id,
        String name,
        String email
) {
    public static SupplierQuickSearchResponse fromNativeRow(Object[] row) {
        return new SupplierQuickSearchResponse(
                ((Number) row[0]).longValue(), // id
                (String) row[1],               // name
                (String) row[2]                // email
        );
    }
}