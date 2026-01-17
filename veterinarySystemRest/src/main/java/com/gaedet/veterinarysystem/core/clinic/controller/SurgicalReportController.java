package com.gaedet.veterinarysystem.core.clinic.controller;

import com.gaedet.veterinarysystem.core.clinic.dto.AddSurgicalReportAnestheticDrugRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.AddSurgicalReportMaterialRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.AddSurgicalReportPostOperativeIndicationRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.CreateSurgicalReportRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalReportCreatedResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalReportDetailResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalReportPatchResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalReportSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.UpdateSurgicalReportRequest;
import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalReportStatus;
import com.gaedet.veterinarysystem.core.clinic.service.SurgicalReportService;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/api/surgical-reports")
@RequiredArgsConstructor
@Validated
public class SurgicalReportController {

    private final SurgicalReportService surgicalReportService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<SurgicalReportSummaryResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) List<SurgicalReportStatus> statuses,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long animalId,
            @RequestParam(required = false) Long attentionId,
            @RequestParam(required = false) Long surgeonId,
            @RequestParam(required = false) Long operatingRoomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        PaginatedResponse<SurgicalReportSummaryResponse> response = surgicalReportService.list(
                statuses,
                branchId,
                animalId,
                attentionId,
                surgeonId,
                operatingRoomId,
                startDate,
                endDate,
                page,
                size
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SurgicalReportDetailResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(surgicalReportService.getDetail(id));
    }

    @GetMapping("/by-attention/{attentionId}")
    public ResponseEntity<SurgicalReportDetailResponse> getByAttention(@PathVariable Long attentionId) {
        return ResponseEntity.ok(surgicalReportService.getOrCreateByAttentionId(attentionId));
    }

    @PostMapping
    public ResponseEntity<SurgicalReportCreatedResponse> create(
            @Valid @RequestBody CreateSurgicalReportRequest request
    ) {
        return ResponseEntity.ok(surgicalReportService.create(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SurgicalReportPatchResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSurgicalReportRequest request
    ) {
        return ResponseEntity.ok(surgicalReportService.update(id, request));
    }

    @PostMapping("/{id}/anesthetic-drugs")
    public ResponseEntity<SurgicalReportDetailResponse> addAnestheticDrug(
            @PathVariable Long id,
            @Valid @RequestBody AddSurgicalReportAnestheticDrugRequest request
    ) {
        return ResponseEntity.ok(surgicalReportService.addAnestheticDrug(id, request));
    }

    @PostMapping("/{id}/materials")
    public ResponseEntity<SurgicalReportDetailResponse> addMaterial(
            @PathVariable Long id,
            @Valid @RequestBody AddSurgicalReportMaterialRequest request
    ) {
        return ResponseEntity.ok(surgicalReportService.addMaterial(id, request));
    }

    @PostMapping("/{id}/post-operative-indications")
    public ResponseEntity<SurgicalReportDetailResponse> addPostOperativeIndication(
            @PathVariable Long id,
            @Valid @RequestBody AddSurgicalReportPostOperativeIndicationRequest request
    ) {
        return ResponseEntity.ok(surgicalReportService.addPostOperativeIndication(id, request));
    }
}
