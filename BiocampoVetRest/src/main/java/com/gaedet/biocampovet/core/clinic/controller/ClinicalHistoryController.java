package com.gaedet.biocampovet.core.clinic.controller;

import com.gaedet.biocampovet.core.animal.enums.AnimalSpecies;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryAnimalSummaryResponse;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse;
import com.gaedet.biocampovet.core.clinic.service.ClinicalHistoryQueryService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/history/clinical")
@RequiredArgsConstructor
public class ClinicalHistoryController {

    private final ClinicalHistoryQueryService clinicalHistoryQueryService;

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','VETERINARIAN','ASSISTANT')")
    @GetMapping("/animals")
    public ResponseEntity<PaginatedResponse<ClinicalHistoryAnimalSummaryResponse>> listAnimals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) List<AnimalSpecies> species,
            @RequestParam(required = false) Boolean active
    ) {
        PaginatedResponse<ClinicalHistoryAnimalSummaryResponse> response = clinicalHistoryQueryService.searchAnimals(
                query,
                species,
                active,
                page,
                size
        );
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','VETERINARIAN','ASSISTANT')")
    @GetMapping("/animal")
    public ResponseEntity<ClinicalHistoryDetailResponse> getAnimalHistory(
            @RequestParam Long animalId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        ClinicalHistoryDetailResponse response = clinicalHistoryQueryService.getAnimalHistory(animalId, from, to);
        return ResponseEntity.ok(response);
    }
}
