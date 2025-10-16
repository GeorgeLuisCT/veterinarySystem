package com.gaedet.biocampovet.core.customer.dto;

public record CustomerQuickSearchResponse(
        Long id,
        String name,
        String documentNumber
) {
    public static CustomerQuickSearchResponse fromNativeRow(Object[] row) {
        return new CustomerQuickSearchResponse(
                ((Number) row[0]).longValue(),  // id
                (String) row[1],                // name
                (String) row[2]                 // document_number
        );
    }
}
