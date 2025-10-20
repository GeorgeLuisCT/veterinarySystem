package com.gaedet.biocampovet.core.clinic.controller;

import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.service.PrescriptionTemplateService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/prescription-templates")
@RequiredArgsConstructor
@Validated
public class PrescriptionTemplateController {

    private final PrescriptionTemplateService prescriptionTemplateService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<PrescriptionTemplateResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q
    ) {
        PaginatedResponse<PrescriptionTemplateResponse> response = prescriptionTemplateService.list(page, size, q);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/detail")
    public ResponseEntity<PrescriptionTemplateResponse> getById(@RequestParam Long id) {
        return ResponseEntity.ok(prescriptionTemplateService.getById(id));
    }

    @GetMapping("/quick-search")
    public ResponseEntity<List<PrescriptionTemplateQuickSearchResponse>> quickSearch(
            @RequestParam(required = false) String query
    ) {
        return ResponseEntity.ok(prescriptionTemplateService.quickSearch(query));
    }


    @PostMapping
    public ResponseEntity<PrescriptionTemplateResponse> create(
            @Valid @RequestBody CreatePrescriptionTemplateRequest request
    ) {
        return ResponseEntity.ok(prescriptionTemplateService.create(request));
    }

    @PutMapping
    public ResponseEntity<PrescriptionTemplateResponse> update(
            @RequestParam Long id,
            @Valid @RequestBody UpdatePrescriptionTemplateRequest request
    ) {
        return ResponseEntity.ok(prescriptionTemplateService.update(id, request));
    }

    @DeleteMapping
    public ResponseEntity<PrescriptionTemplateSummaryResponse> delete(@RequestParam Long id) {
        return ResponseEntity.ok(prescriptionTemplateService.delete(id));
    }
}
