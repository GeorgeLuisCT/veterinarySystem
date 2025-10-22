package com.gaedet.biocampovet.core.clinic.controller;

import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.enums.AttentionType;
import com.gaedet.biocampovet.core.clinic.enums.AttentionsStatus;
import com.gaedet.biocampovet.core.clinic.service.AttentionService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/attentions")
@RequiredArgsConstructor
@Validated
public class AttentionController {

    private final AttentionService attentionService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<AttentionResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) AttentionType type,
            @RequestParam(required = false) AttentionsStatus status,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long animalId,
            @RequestParam(required = false) Boolean emergency,
            @RequestParam(required = false) Long appointmentId,
            @RequestParam(required = false) Long clinicalServiceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        PaginatedResponse<AttentionResponse> response = attentionService.list(
                type,
                status,
                branchId,
                animalId,
                emergency,
                appointmentId,
                clinicalServiceId,
                startDate,
                endDate,
                page,
                size
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttentionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(attentionService.getById(id));
    }

    @PostMapping
    public ResponseEntity<AttentionResponse> create(
            @Valid @RequestBody CreateAttentionRequest request
    ) {
        return ResponseEntity.ok(attentionService.create(request));
    }

    @PostMapping("/from-appointment")
    public ResponseEntity<AttentionResponse> createFromAppointment(
            @Valid @RequestBody CreateAttentionFromAppointmentRequest request
    ) {
        return ResponseEntity.ok(attentionService.createFromAppointment(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AttentionResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAttentionStatusRequest request
    ) {
        return ResponseEntity.ok(attentionService.updateStatus(id, request));
    }

    @PatchMapping("/{id}/attending-employee")
    public ResponseEntity<AttentionResponse> updateAttendingEmployee(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAttentionAttendingEmployeeRequest request
    ) {
        return ResponseEntity.ok(attentionService.updateAttendingEmployee(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        attentionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
