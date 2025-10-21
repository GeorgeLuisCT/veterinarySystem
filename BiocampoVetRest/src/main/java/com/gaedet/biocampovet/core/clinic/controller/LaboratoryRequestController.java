package com.gaedet.biocampovet.core.clinic.controller;

import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.enums.LabRequestStatus;
import com.gaedet.biocampovet.core.clinic.service.LaboratoryRequestService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/laboratory-requests")
@RequiredArgsConstructor
@Validated
public class LaboratoryRequestController {

    private final LaboratoryRequestService laboratoryRequestService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<LaboratoryRequestSummaryResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) List<LabRequestStatus> statuses,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long animalId,
            @RequestParam(required = false) Long laboratoryId,
            @RequestParam(required = false) Long requestingEmployeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        PaginatedResponse<LaboratoryRequestSummaryResponse> response = laboratoryRequestService.list(
                statuses, branchId, animalId, laboratoryId, requestingEmployeeId, startDate, endDate, page, size
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<LaboratoryRequestDetailResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(laboratoryRequestService.getDetail(id));
    }

    @PostMapping
    public ResponseEntity<LaboratoryRequestDetailResponse> create(@Valid @RequestBody CreateLaboratoryRequest request) {
        return ResponseEntity.ok(laboratoryRequestService.create(request));
    }

    @PostMapping("/items/{requestItemId}/results")
    public ResponseEntity<LaboratoryRequestDetailResponse> addResults(
            @PathVariable Long requestItemId,
            @Valid @RequestBody AddResultValuesRequest request
    ) {
        return ResponseEntity.ok(laboratoryRequestService.addResults(requestItemId, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<LaboratoryRequestDetailResponse> updateRequestStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLabRequestStatusRequest body
    ) {
        LaboratoryRequestDetailResponse resp =
                laboratoryRequestService.updateRequestStatus(id, body.getStatus());
        return ResponseEntity.ok(resp);
    }

}
