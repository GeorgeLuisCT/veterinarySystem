package com.gaedet.veterinarysystem.core.clinic.controller;

import com.gaedet.veterinarysystem.core.clinic.dto.*;
import com.gaedet.veterinarysystem.core.clinic.service.HealthPlanService;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/health-plans")
@RequiredArgsConstructor
@Validated
public class HealthPlanController {

    private final HealthPlanService healthPlanService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<HealthPlanResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q
    ) {
        PaginatedResponse<HealthPlanResponse> response = healthPlanService.list(page, size, q);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/detail")
    public ResponseEntity<HealthPlanResponse> getById(@RequestParam Long id) {
        return ResponseEntity.ok(healthPlanService.getById(id));
    }

    @PostMapping
    public ResponseEntity<HealthPlanResponse> create(
            @Valid @RequestBody CreateHealthPlanRequest request
    ) {
        return ResponseEntity.ok(healthPlanService.create(request));
    }

    @PutMapping
    public ResponseEntity<HealthPlanResponse> update(
            @RequestParam Long id,
            @Valid @RequestBody UpdateHealthPlanRequest request
    ) {
        return ResponseEntity.ok(healthPlanService.update(id, request));
    }

    @DeleteMapping
    public ResponseEntity<HealthPlanResponse> delete(@RequestParam Long id) {
        return ResponseEntity.ok(healthPlanService.delete(id));
    }
}
