package com.gaedet.veterinarysystem.core.users.dto;


public record UserSummaryResponse(
        Long userId,
        String username,
        int cantRoles,
        String fullName,
        String email,
        String phoneNumber,
        String burden,
        String branchNames,
        boolean active
) {
    public static UserSummaryResponse fromNativeRow(Object[] row) {
        return new UserSummaryResponse(
                ((Number) row[0]).longValue(),       // userId
                (String) row[1],                     // username
                ((Number) row[2]).intValue(),        // cantRoles
                (String) row[3],                     // fullName
                (String) row[4],                     // email
                (String) row[5],                     // phoneNumber
                (String) row[6],                     // burden
                (String) row[7],                     // branchNames
                row[8] instanceof Boolean b ? b : Boolean.TRUE
        );
    }
}

