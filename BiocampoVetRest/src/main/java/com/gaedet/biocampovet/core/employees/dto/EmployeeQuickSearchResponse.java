package com.gaedet.biocampovet.core.employees.dto;

public record EmployeeQuickSearchResponse(
        Long id,
        String fullName,
        String email
) {
    public static EmployeeQuickSearchResponse fromNativeRow(Object[] row) {
        return new EmployeeQuickSearchResponse(
                ((Number) row[0]).longValue(), // id
                (String) row[1],               // full_name
                (String) row[2]                // email
        );
    }
}