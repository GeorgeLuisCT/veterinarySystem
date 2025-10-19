package com.gaedet.biocampovet.core.animal.dto;

import com.gaedet.biocampovet.core.animal.enums.AnimalSex;
import com.gaedet.biocampovet.core.animal.enums.AnimalSpecies;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnimalBasicResponse {
    private Long animalId;
    private String animalName;
    private String animalPhotoUrl;
    private AnimalSpecies animalSpecies;
    private String animalBreed;
    private AnimalSex sex;
    private String microchipNumber;
}
