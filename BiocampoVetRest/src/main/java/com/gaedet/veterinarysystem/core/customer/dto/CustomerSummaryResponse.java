package com.gaedet.veterinarysystem.core.customer.dto;

public record CustomerSummaryResponse(
        Long id,
        String name,
        String documentNumber,
        String documentTypeName,
        String phoneNumber,
        String email,
        boolean isActive
) {
    public static CustomerSummaryResponse fromNativeRow(Object[] row) {
        return new CustomerSummaryResponse(
                ((Number) row[0]).longValue(),    // id
                (String) row[1],                  // name
                (String) row[2],                  // document_number
                (String) row[3],                  // document_type_name
                (String) row[4],                  // phone_number
                (String) row[5],                  // email
                (Boolean) row[6]                  // isActive
        );
    }
}