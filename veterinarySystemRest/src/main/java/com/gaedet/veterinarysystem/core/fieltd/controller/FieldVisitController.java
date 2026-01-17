package com.gaedet.veterinarysystem.core.fieltd.controller;

import com.gaedet.veterinarysystem.core.fieltd.dto.*;
import com.gaedet.veterinarysystem.core.fieltd.enums.FieldVisitStatus;
import com.gaedet.veterinarysystem.core.fieltd.service.FieldVisitService;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/fieldwork/visits")
@RequiredArgsConstructor
@Validated
public class FieldVisitController {

    private final FieldVisitService fieldVisitService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<FieldVisitSummaryResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) FieldVisitStatus status,
            @RequestParam(required = false) Long vetId,
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) Long vehicleId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return ResponseEntity.ok(fieldVisitService.list(page, size, q, status, vetId, farmId, zoneId, vehicleId, from, to));
    }

    @GetMapping("/detail")
    public ResponseEntity<FieldVisitResponse> getById(@RequestParam Long id) {
        return ResponseEntity.ok(fieldVisitService.getById(id));
    }

    @PostMapping
    public ResponseEntity<FieldVisitResponse> create(@Valid @RequestBody CreateFieldVisitRequest r) {
        return ResponseEntity.ok(fieldVisitService.create(r));
    }

    @PutMapping
    public ResponseEntity<FieldVisitResponse> update(@RequestParam Long id, @Valid @RequestBody UpdateFieldVisitRequest r) {
        return ResponseEntity.ok(fieldVisitService.update(id, r));
    }

    @DeleteMapping
    public ResponseEntity<FieldVisitSummaryResponse> delete(@RequestParam Long id) {
        return ResponseEntity.ok(fieldVisitService.delete(id));
    }

    @PostMapping("/service-item")
    public ResponseEntity<FieldVisitServiceItemResponse> addServiceItem(@RequestParam Long visitId, @Valid @RequestBody AddServiceItemRequest r) {
        return ResponseEntity.ok(fieldVisitService.addServiceItem(visitId, r));
    }

    @PatchMapping("/report")
    public ResponseEntity<FieldVisitReportResponse> updateReport(@RequestParam Long visitId,
                                                                 @Valid @RequestBody UpdateFieldVisitReportRequest request) {
        return ResponseEntity.ok(fieldVisitService.updateReport(visitId, request));
    }

    @PostMapping("/product-usage")
    public ResponseEntity<FieldVisitProductUsageResponse> addProductUsage(@RequestParam Long visitId,
                                                                          @Valid @RequestBody AddProductUsageRequest r,
                                                                          @RequestParam(required = false) Long performedById) {
        return ResponseEntity.ok(fieldVisitService.addProductUsage(visitId, r, performedById));
    }

    @PostMapping("/attachment")
    public ResponseEntity<FieldVisitAttachmentResponse> addAttachment(@RequestParam Long visitId, @Valid @RequestBody AddAttachmentRequest r) {
        return ResponseEntity.ok(fieldVisitService.addAttachment(visitId, r));
    }

    @PutMapping("/biosecurity")
    public ResponseEntity<FieldVisitBiosecurityResponse> setBiosecurity(@RequestParam Long visitId, @Valid @RequestBody SetBiosecurityRequest r) {
        return ResponseEntity.ok(fieldVisitService.setBiosecurity(visitId, r));
    }

    @PatchMapping("/status")
    public ResponseEntity<FieldVisitResponse> updateStatus(@RequestParam Long visitId,
                                                           @Valid @RequestBody UpdateFieldVisitStatusRequest request) {
        return ResponseEntity.ok(fieldVisitService.updateStatus(visitId, request));
    }
}
