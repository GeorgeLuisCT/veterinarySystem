package com.gaedet.veterinarysystem.core.animal.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.gaedet.veterinarysystem.core.animal.enums.AnimalSex;
import com.gaedet.veterinarysystem.core.animal.enums.AnimalSpecies;
import com.gaedet.veterinarysystem.core.customer.dto.CustomerResponse;
import lombok.*;

import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AnimalResponse {

    private Long id;
    private String name;
    private String photoUrl;
    private CustomerResponse owner;
    private AnimalSpecies species;
    private String breed;
    private LocalDate birthDate;
    private AnimalSex sex;
    private String microchipNumber;
    private Set<String> allergies;
    private Set<String> chronicConditions;
    private boolean isActive;
}


