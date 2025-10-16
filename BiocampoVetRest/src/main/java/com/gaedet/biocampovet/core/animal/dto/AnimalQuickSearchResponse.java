package com.gaedet.biocampovet.core.animal.dto;

import java.time.LocalDate;

public record AnimalQuickSearchResponse(
        Long id,
        String name,
        LocalDate birthDate
) {
    public static AnimalQuickSearchResponse fromNativeRow(Object[] row) {
        return new AnimalQuickSearchResponse(
                ((Number) row[0]).longValue(),    // id
                (String) row[1],                  // name
                ((java.sql.Date) row[2]).toLocalDate()  // birth_date
        );
    }
}
