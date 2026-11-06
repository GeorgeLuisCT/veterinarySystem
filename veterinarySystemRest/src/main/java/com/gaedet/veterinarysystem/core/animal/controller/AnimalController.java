package com.gaedet.veterinarysystem.core.animal.controller;

import com.gaedet.veterinarysystem.core.animal.dto.*;
import com.gaedet.veterinarysystem.core.animal.service.AnimalService;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.security.provider.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/animals")
@RequiredArgsConstructor
public class AnimalController {

    private final AnimalService animalService;
    private final JwtTokenProvider jwtTokenProvider;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'VETERINARIAN')")
    @PostMapping("/create")
    public ResponseEntity<AnimalSummaryResponse> createAnimal(@Valid @RequestBody AnimalCreateRequest request) {
        return ResponseEntity.ok(animalService.createAnimal(request));
    }

    @GetMapping("/get")
    public ResponseEntity<AnimalResponse> getAnimal(@RequestParam Long id) {
        return ResponseEntity.ok(animalService.getAnimal(id));
    }

    @GetMapping("/list")
    public ResponseEntity<PaginatedResponse<AnimalSummaryResponse>> getAnimals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam boolean active,
            @RequestParam(required = false) String query
    ) {
        return ResponseEntity.ok(animalService.getAnimals(page, size, active, query));
    }

    @GetMapping("/quick-search")
    public ResponseEntity<List<AnimalQuickSearchResponse>> quickSearch(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "true") boolean active
    ) {
        return ResponseEntity.ok(animalService.quickSearch(query, active));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'VETERINARIAN')")
    @PutMapping("/update")
    public ResponseEntity<AnimalSummaryResponse> updateAnimal(@Valid @RequestBody AnimalUpdateRequest request) {
        return ResponseEntity.ok(animalService.updateAnimal(request));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'VETERINARIAN')")
    @DeleteMapping("/soft-delete")
    public ResponseEntity<Map<String, String>> softDeleteAnimal(@RequestParam Long id) {
        animalService.softDeleteAnimal(id);
        return ResponseEntity.ok(Map.of("message", "Animal deshabilitado correctamente"));
    }

    @PreAuthorize("hasAnyRole(\'ADMIN\', \'MANAGER\')")
    @DeleteMapping("/hard-delete")
    public ResponseEntity<Map<String, String>> hardDeleteAnimal(@RequestParam Long id) {
        animalService.hardDeleteAnimal(id);
        return ResponseEntity.ok(Map.of("message", "Animal eliminado permanentemente"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'VETERINARIAN')")
    @PutMapping("/restore")
    public ResponseEntity<AnimalSummaryResponse> restoreAnimal(@RequestParam Long id) {
        AnimalSummaryResponse response = animalService.restoreAnimal(id);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST', 'VETERINARIAN')")
    @GetMapping("/clinical-history")
    public ResponseEntity<ClinicalHistoryResponse> getAnimalClinicalHistoryGrouped(@RequestParam Long animalId) {
        return ResponseEntity.ok(animalService.getAnimalClinicalHistoryGrouped(animalId));
    }
}

