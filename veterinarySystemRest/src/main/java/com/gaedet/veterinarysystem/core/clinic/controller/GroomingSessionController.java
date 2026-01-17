package com.gaedet.veterinarysystem.core.clinic.controller;

import com.gaedet.veterinarysystem.core.clinic.dto.*;
import com.gaedet.veterinarysystem.core.clinic.enums.GroomingStatus;
import com.gaedet.veterinarysystem.core.clinic.service.GroomingSessionService;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/grooming-sessions")
@RequiredArgsConstructor
@Validated
public class GroomingSessionController {

    private final GroomingSessionService groomingSessionService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<GroomingSessionSummaryResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) List<GroomingStatus> statuses,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long animalId,
            @RequestParam(required = false) Long attentionId,
            @RequestParam(required = false) Long assignedProfessionalId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        PaginatedResponse<GroomingSessionSummaryResponse> response = groomingSessionService.list(
                statuses,
                branchId,
                animalId,
                attentionId,
                assignedProfessionalId,
                startDate,
                endDate,
                page,
                size
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroomingSessionDetailResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(groomingSessionService.getDetail(id));
    }

    @GetMapping("/by-attention/{attentionId}")
    public ResponseEntity<GroomingSessionDetailResponse> getByAttention(@PathVariable Long attentionId) {
        return ResponseEntity.ok(groomingSessionService.getOrCreateByAttentionId(attentionId));
    }

    @PostMapping
    public ResponseEntity<GroomingSessionCreatedResponse> create(
            @Valid @RequestBody CreateGroomingSessionRequest request
    ) {
        return ResponseEntity.ok(groomingSessionService.create(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<GroomingSessionPatchResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGroomingSessionRequest request
    ) {
        return ResponseEntity.ok(groomingSessionService.update(id, request));
    }

    @PostMapping("/{id}/materials")
    public ResponseEntity<GroomingSessionDetailResponse> addMaterial(
            @PathVariable Long id,
            @Valid @RequestBody AddGroomingMaterialRequest request
    ) {
        return ResponseEntity.ok(groomingSessionService.addMaterial(id, request));
    }
}
