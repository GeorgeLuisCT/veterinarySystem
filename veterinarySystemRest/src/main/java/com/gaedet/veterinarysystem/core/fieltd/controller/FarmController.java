package com.gaedet.veterinarysystem.core.fieltd.controller;

import com.gaedet.veterinarysystem.core.fieltd.dto.*;
import com.gaedet.veterinarysystem.core.fieltd.service.FarmService;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/farms")
@RequiredArgsConstructor
@Validated
public class FarmController {

    private final FarmService farmService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<FarmSummaryResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long zoneId
    ) {
        return ResponseEntity.ok(farmService.list(page, size, q, customerId, zoneId));
    }

    @GetMapping("/detail")
    public ResponseEntity<FarmResponse> getById(@RequestParam Long id) {
        return ResponseEntity.ok(farmService.getById(id));
    }

    @GetMapping("/quick-search")
    public ResponseEntity<List<FarmQuickSearchResponse>> quickSearch(@RequestParam(required = false) String q,
                                                                     @RequestParam(required = false) Long zoneId) {
        return ResponseEntity.ok(farmService.quickSearch(q, zoneId));
    }

    @PostMapping
    public ResponseEntity<FarmResponse> create(@Valid @RequestBody CreateFarmRequest r) {
        return ResponseEntity.ok(farmService.create(r));
    }

    @PutMapping
    public ResponseEntity<FarmResponse> update(@RequestParam Long id, @Valid @RequestBody UpdateFarmRequest r) {
        return ResponseEntity.ok(farmService.update(id, r));
    }

    @DeleteMapping
    public ResponseEntity<FarmSummaryResponse> delete(@RequestParam Long id) {
        return ResponseEntity.ok(farmService.delete(id));
    }
}
