package com.gaedet.biocampovet.core.clinic.controller;

import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.enums.HospitalizationStatus;
import com.gaedet.biocampovet.core.clinic.service.HospitalizationService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/hospitalizations")
@RequiredArgsConstructor
public class HospitalizationController {

    private final HospitalizationService hospitalizationService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<HospitalizationSummaryResponse>> list(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long animalId,
            @RequestParam(required = false) Long cageId,
            @RequestParam(required = false) List<HospitalizationStatus> statuses,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        PaginatedResponse<HospitalizationSummaryResponse> response = hospitalizationService.list(
                branchId, animalId, cageId, statuses, startDate, endDate, page, pageSize);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<HospitalizationResponse> getHospitalizationById(@PathVariable Long id) {
        return ResponseEntity.ok(hospitalizationService.getHospitalizationById(id));
    }

    @PostMapping
    public ResponseEntity<CageResponse> createHospitalization(
            @Valid @RequestBody CreateHospitalizationRequest request) {
        CageResponse response = hospitalizationService.createHospitalization(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<HospitalizationPatchResponse> patchHospitalization(
            @PathVariable Long id, @Valid @RequestBody UpdateHospitalizationRequest request) {
        return ResponseEntity.ok(hospitalizationService.patchHospitalization(id, request));
    }

    @PostMapping("/{id}/evolution-notes")
    public ResponseEntity<HospitalizationResponse> addEvolutionNote(
            @PathVariable Long id, @Valid @RequestBody AddEvolutionNoteRequest request) {
        return ResponseEntity.ok(hospitalizationService.addEvolutionNote(id, request));
    }

    @PostMapping("/{id}/vitals")
    public ResponseEntity<HospitalizationResponse> addVitalSigns(
            @PathVariable Long id, @Valid @RequestBody CreateHospitalizationVitalSignRequest request) {
        return ResponseEntity.ok(hospitalizationService.addVitalSign(id, request));
    }

    @PatchMapping("/{hospitalizationId}/treatment-schedules/{scheduleId}")
    public ResponseEntity<HospitalizationResponse> updateTreatmentSchedule(
            @PathVariable Long hospitalizationId,
            @PathVariable Long scheduleId,
            @Valid @RequestBody UpdateTreatmentScheduleRequest request) {
        return ResponseEntity
                .ok(hospitalizationService.updateTreatmentSchedule(hospitalizationId, scheduleId, request));
    }

    @PostMapping("/{hospitalizationId}/treatment-schedules")
    public ResponseEntity<HospitalizationResponse> addTreatmentSchedule(
            @PathVariable Long hospitalizationId,
            @Valid @RequestBody CreateTreatmentScheduleRequest request) {
        return ResponseEntity.ok(hospitalizationService.addTreatmentSchedule(hospitalizationId, request));
    }
}
