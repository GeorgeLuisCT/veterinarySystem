package com.gaedet.biocampovet.core.employees.dto;

public record EmployeeSummaryResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        String burden,
        String branchNames,
        boolean isActive
) {
    public static EmployeeSummaryResponse fromNativeRow(Object[] row) {
        return new EmployeeSummaryResponse(
                ((Number) row[0]).longValue(), // id
                (String) row[1],               // first_name
                (String) row[2],               // last_name
                (String) row[3],               // email
                (String) row[4],               // phone_number
                (String) row[5],               // burden
                (String) row[6],               // branch_names
                row[7] != null && (boolean) row[7] // is_active
        );
    }
}