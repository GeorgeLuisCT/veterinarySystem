package com.gaedet.veterinarysystem.core.clinic.controller;

import com.gaedet.veterinarysystem.core.clinic.dto.*;
import com.gaedet.veterinarysystem.core.clinic.service.LaboratoryTestService;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/laboratory-tests")
@RequiredArgsConstructor
@Validated
public class LaboratoryTestController {

    private final LaboratoryTestService laboratoryTestService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<LaboratoryTestSummaryResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long laboratoryId
    ) {
        var resp = laboratoryTestService.list(page, size, q, laboratoryId);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LaboratoryTestResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(laboratoryTestService.getById(id));
    }

    @PostMapping
    public ResponseEntity<LaboratoryTestResponse> create(@Valid @RequestBody CreateLaboratoryTestRequest request) {
        return ResponseEntity.ok(laboratoryTestService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LaboratoryTestResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateLaboratoryTestRequest request) {
        return ResponseEntity.ok(laboratoryTestService.update(id, request));
    }

    @PatchMapping("/laboratory-activation")
    public ResponseEntity<LaboratoryTestSummaryResponse> setLaboratoryActivation(
            @RequestParam Long id,
            @Valid @RequestBody LaboratoryActivationInput r
    ) {
        LaboratoryTestSummaryResponse summary =
                laboratoryTestService.setLaboratoryActivation(id, r.getLaboratoryId(), Boolean.TRUE.equals(r.getActive()));
        return ResponseEntity.ok(summary);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<LaboratoryTestSummaryResponse> delete(@PathVariable Long id) {
        LaboratoryTestSummaryResponse summary = laboratoryTestService.delete(id);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/quick-search")
    public ResponseEntity<List<LaboratoryTestQuickSearchResponse>> quickSearch(
            @RequestParam String name,
            @RequestParam(required = false) Long laboratoryId
    ) {
        return ResponseEntity.ok(laboratoryTestService.quickSearch(name, laboratoryId));
    }
}
