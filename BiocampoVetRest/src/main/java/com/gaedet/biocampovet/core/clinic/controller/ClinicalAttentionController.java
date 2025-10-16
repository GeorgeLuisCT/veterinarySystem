package com.gaedet.biocampovet.core.clinic.controller;

import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalAttentionStatus;
import com.gaedet.biocampovet.core.clinic.service.ClinicalAttentionService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/clinical-attentions")
@RequiredArgsConstructor
@Validated
public class ClinicalAttentionController {

    private final ClinicalAttentionService clinicalAttentionService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<ClinicalAttentionSummaryResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) List<ClinicalAttentionStatus> statuses,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long animalId,
            @RequestParam(required = false) Long attentionId,
            @RequestParam(required = false) Long attendingEmployeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        PaginatedResponse<ClinicalAttentionSummaryResponse> response = clinicalAttentionService.list(
                statuses,
                branchId,
                animalId,
                attentionId,
                attendingEmployeeId,
                startDate,
                endDate,
                page,
                size
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClinicalAttentionDetailResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(clinicalAttentionService.getDetail(id));
    }

    @PostMapping
    public ResponseEntity<ClinicalAttentionCreatedResponse> create(
            @Valid @RequestBody CreateClinicalAttentionRequest request
    ) {
        return ResponseEntity.ok(clinicalAttentionService.create(request));
    }

    @GetMapping("/by-attention/{attentionId}")
    public ResponseEntity<ClinicalAttentionDetailResponse> getOrCreateByAttentionId(
            @PathVariable Long attentionId
    ) {
        ClinicalAttentionDetailResponse response = clinicalAttentionService.getOrCreateByAttentionId(attentionId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ClinicalAttentionPatchResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateClinicalAttentionRequest request
    ) {
        return ResponseEntity.ok(clinicalAttentionService.update(id, request));
    }

    @PostMapping("/{id}/medication-administrations")
    public ResponseEntity<ClinicalAttentionDetailResponse> addMedication(
            @PathVariable Long id,
            @Valid @RequestBody AddClinicalAttentionMedicationRequest request
    ) {
        return ResponseEntity.ok(clinicalAttentionService.registerMedication(id, request));
    }

    @PostMapping("/{id}/service-items")
    public ResponseEntity<ClinicalAttentionDetailResponse> addServiceItem(
            @PathVariable Long id,
            @Valid @RequestBody AddClinicalAttentionServiceItemRequest request
    ) {
        return ResponseEntity.ok(clinicalAttentionService.addServiceItem(id, request));
    }

    @PostMapping("/{id}/surgical-orders")
    public ResponseEntity<ClinicalAttentionDetailResponse> addSurgicalOrder(
            @PathVariable Long id,
            @Valid @RequestBody AddClinicalAttentionSurgicalOrderRequest request
    ) {
        return ResponseEntity.ok(clinicalAttentionService.addSurgicalOrder(id, request));
    }

    @PostMapping("/{id}/laboratory-requests")
    public ResponseEntity<ClinicalAttentionDetailResponse> addLaboratoryRequest(
            @PathVariable Long id,
            @Valid @RequestBody AddClinicalAttentionLaboratoryRequest request
    ) {
        return ResponseEntity.ok(clinicalAttentionService.addLaboratoryRequest(id, request));
    }

    @GetMapping("/active/grouped")
    public ResponseEntity<List<ClinicalAttentionStatusGroupResponse>> listActiveGrouped(
            @RequestParam(required = false) Long attendingEmployeeId
    ) {
        return ResponseEntity.ok(clinicalAttentionService.listActiveGroupedByStatus(attendingEmployeeId));
    }
}
