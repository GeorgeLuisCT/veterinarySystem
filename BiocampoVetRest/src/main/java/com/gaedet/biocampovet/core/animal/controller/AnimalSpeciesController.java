package com.gaedet.biocampovet.core.animal.controller;


import com.gaedet.biocampovet.core.animal.dto.AnimalSpeciesResponse;
import com.gaedet.biocampovet.core.animal.service.AnimalSpeciesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/animal-species")
@RequiredArgsConstructor
public class AnimalSpeciesController {

    private final AnimalSpeciesService animalSpeciesService;

    @GetMapping
    public ResponseEntity<List<AnimalSpeciesResponse>> getAnimalSpecies() {
        return ResponseEntity.ok(animalSpeciesService.getAllActiveSpecies());
    }
}