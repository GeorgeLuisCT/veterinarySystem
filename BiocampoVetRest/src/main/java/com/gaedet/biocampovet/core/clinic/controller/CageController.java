package com.gaedet.biocampovet.core.clinic.controller;

import com.gaedet.biocampovet.core.clinic.dto.CageRequest;
import com.gaedet.biocampovet.core.clinic.dto.CageResponse;
import com.gaedet.biocampovet.core.clinic.service.CageService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/cages")
@RequiredArgsConstructor
public class CageController {

    private final CageService cageService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<CageResponse>> list(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) Boolean isOccupied,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        PaginatedResponse<CageResponse> response = cageService.list(branchId, name, size, isOccupied, page, pageSize);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CageResponse> getCageById(@PathVariable Long id) {
        return ResponseEntity.ok(cageService.findById(id));
    }

    @PostMapping
    public ResponseEntity<CageResponse> createCage(@Valid @RequestBody CageRequest cageRequest) {
        CageResponse createdCage = cageService.create(cageRequest);
        return new ResponseEntity<>(createdCage, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CageResponse> updateCage(@PathVariable Long id, @Valid @RequestBody CageRequest cageRequest) {
        return ResponseEntity.ok(cageService.update(id, cageRequest));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCage(@PathVariable Long id) {
        cageService.delete(id);
        return ResponseEntity.noContent().build();
    }
}