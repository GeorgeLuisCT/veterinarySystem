package com.gaedet.veterinarysystem.core.clinic.dto.history;

import com.gaedet.veterinarysystem.core.animal.enums.AnimalSex;
import com.gaedet.veterinarysystem.core.animal.enums.AnimalSpecies;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class ClinicalHistoryAnimalSummaryResponse {
    private final Long animalId;
    private final String animalName;
    private final AnimalSpecies species;
    private final String speciesLabel;
    private final String breed;
    private final AnimalSex sex;
    private final String ownerName;
    private final String ownerPhone;
    private final String ownerEmail;
    private final String microchip;
    private final LocalDate birthDate;
    private final String age;
    private final boolean active;
    private final LocalDateTime lastVisitDate;
    private final String lastVisitService;
    private final String lastVeterinarian;
    private final long totalConsultations;
    private final long totalLabRequests;
    private final long totalProcedures;
    private final Double lastRecordedWeightKg;
}
