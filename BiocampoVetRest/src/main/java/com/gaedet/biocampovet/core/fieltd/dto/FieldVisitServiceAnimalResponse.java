package com.gaedet.biocampovet.core.fieltd.dto;

import com.gaedet.biocampovet.core.animal.enums.AnimalSpecies;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitServiceAnimalResponse {
    private Long id;
    private Long animalId;
    private String animalName;
    private AnimalSpecies species;
    private String breed;
}
