package com.gaedet.veterinarysystem.core.animal.dto;

import com.gaedet.veterinarysystem.core.animal.enums.AnimalSpecies;

import java.time.LocalDate;

public record AnimalSummaryResponse(
        Long id,
        String name,
        LocalDate birthDate,
        String breed,
        AnimalSpecies species,
        String ownerName,
        boolean isActive
) {
    public static AnimalSummaryResponse fromNativeRow(Object[] row) {
        return new AnimalSummaryResponse(
                ((Number) row[0]).longValue(),    // id
                (String) row[1],                  // name
                ((java.sql.Date) row[2]).toLocalDate(), // birthDate
                (String) row[3],                  // breed
                AnimalSpecies.valueOf((String) row[4]),
                (String) row[5],                  // owner name
                (Boolean) row[6]                  // isActive
        );
    }
}
