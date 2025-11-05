package com.gaedet.biocampovet.core.publicportal.dto;

import com.gaedet.biocampovet.core.animal.enums.AnimalSex;
import com.gaedet.biocampovet.core.animal.enums.AnimalSpecies;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PublicAnimalSummaryResponse {
    private final Long id;
    private final String name;
    private final String photoUrl;
    private final AnimalSpecies species;
    private final String speciesLabel;
    private final String breed;
    private final AnimalSex sex;
}
