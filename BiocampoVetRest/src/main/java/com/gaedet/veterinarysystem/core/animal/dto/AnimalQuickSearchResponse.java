package com.gaedet.veterinarysystem.core.animal.dto;

import com.gaedet.veterinarysystem.core.animal.enums.AnimalSpecies;

import java.time.LocalDate;

public record AnimalQuickSearchResponse(
        Long id,
        String name,
        LocalDate birthDate,
        String ownerName,
        AnimalSpecies species,
        String photoUrl,
        String microchipNumber
) {
    public static AnimalQuickSearchResponse fromNativeRow(Object[] row) {
        return new AnimalQuickSearchResponse(
                ((Number) row[0]).longValue(),
                (String) row[1],
                ((java.sql.Date) row[2]).toLocalDate(),
                (String) row[3],
                AnimalSpecies.valueOf((String) row[4]),
                (String) row[5],
                (String) row[6]
        );
    }
}