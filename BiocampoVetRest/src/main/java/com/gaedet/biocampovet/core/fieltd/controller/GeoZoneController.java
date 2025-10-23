package com.gaedet.biocampovet.core.fieltd.controller;

import com.gaedet.biocampovet.core.fieltd.dto.*;
import com.gaedet.biocampovet.core.fieltd.enums.GeoZoneType;
import com.gaedet.biocampovet.core.fieltd.service.GeoZoneService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/geo-zones")
@RequiredArgsConstructor
@Validated
public class GeoZoneController {

    private final GeoZoneService geoZoneService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<GeoZoneSummaryResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) GeoZoneType type,
            @RequestParam(required = false) Long parentId,
            @RequestParam(required = false) Boolean active
    ) {
        return ResponseEntity.ok(geoZoneService.list(page, size, q, type, parentId, active));
    }

    @GetMapping("/detail")
    public ResponseEntity<GeoZoneResponse> getById(@RequestParam Long id) {
        return ResponseEntity.ok(geoZoneService.getById(id));
    }

    @PostMapping
    public ResponseEntity<GeoZoneResponse> create(@Valid @RequestBody CreateGeoZoneRequest r) {
        return ResponseEntity.ok(geoZoneService.create(r));
    }

    @PutMapping
    public ResponseEntity<GeoZoneResponse> update(@RequestParam Long id, @Valid @RequestBody UpdateGeoZoneRequest r) {
        return ResponseEntity.ok(geoZoneService.update(id, r));
    }

    @DeleteMapping
    public ResponseEntity<GeoZoneSummaryResponse> delete(@RequestParam Long id) {
        return ResponseEntity.ok(geoZoneService.delete(id));
    }
}
