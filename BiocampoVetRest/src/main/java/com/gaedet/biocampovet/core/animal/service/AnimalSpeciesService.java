package com.gaedet.biocampovet.core.animal.service;

import com.gaedet.biocampovet.core.animal.dto.AnimalSpeciesResponse;
import com.gaedet.biocampovet.core.animal.entity.AnimalSpecies;
import com.gaedet.biocampovet.core.animal.repository.AnimalSpeciesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnimalSpeciesService {

    private final AnimalSpeciesRepository animalSpeciesRepository;

    public List<AnimalSpeciesResponse> getAllActiveSpecies() {
        List<AnimalSpecies> speciesList = animalSpeciesRepository.findAll();
        return speciesList.stream()
                .map(species -> AnimalSpeciesResponse.builder()
                        .id(species.getId())
                        .name(species.getName())
                        .build())
                .collect(Collectors.toList());
    }
}

