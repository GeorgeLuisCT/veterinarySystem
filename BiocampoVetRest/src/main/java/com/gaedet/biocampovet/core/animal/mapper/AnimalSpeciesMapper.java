package com.gaedet.biocampovet.core.animal.mapper;

import com.gaedet.biocampovet.core.animal.dto.AnimalSpeciesResponse;
import com.gaedet.biocampovet.core.animal.entity.AnimalSpecies;
import org.springframework.stereotype.Component;

@Component
public class AnimalSpeciesMapper {

    public AnimalSpeciesResponse toResponse(AnimalSpecies entity) {
        if (entity == null) {
            return null;
        }

        return AnimalSpeciesResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .build();
    }
}
