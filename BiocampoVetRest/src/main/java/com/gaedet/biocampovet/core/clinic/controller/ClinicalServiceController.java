package com.gaedet.biocampovet.core.clinic.controller;

import com.gaedet.biocampovet.core.branches.dto.BranchActivationInput;
import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.biocampovet.core.clinic.service.ClinicalServiceService;

import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.security.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/clinical-services")
@RequiredArgsConstructor
@Validated
public class ClinicalServiceController {

    private final ClinicalServiceService clinicalServiceService;
    private final JwtUtils jwtUtils;

    private Long extractBranchIdOrZero(HttpServletRequest request) {
        Long branchIdOrZero = 0L;
        String token = jwtUtils.extractToken(request);
        if (token != null && jwtUtils.validateToken(token)) {
            Long b = jwtUtils.extractBranchId(token);
            if (b != null) branchIdOrZero = b;
        }
        return branchIdOrZero;
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<ClinicalServiceSummaryResponse>> list(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) ClinicalServiceCategory category
    ) {
        Long branchIdOrZero = extractBranchIdOrZero(request);
        var resp = clinicalServiceService.list(page, size, q, category, branchIdOrZero);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/detail")
    public ResponseEntity<ClinicalServiceResponse> getById(
            @RequestParam Long id
    ) {
        return ResponseEntity.ok(clinicalServiceService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ClinicalServiceResponse> create(@Valid @RequestBody CreateClinicalServiceRequest r) {
        return ResponseEntity.ok(clinicalServiceService.create(r));
    }

    @PutMapping
    public ResponseEntity<ClinicalServiceResponse> update(
            @RequestParam Long id,
            @Valid @RequestBody UpdateClinicalServiceRequest r
    ) {
        return ResponseEntity.ok(clinicalServiceService.update(id, r));
    }

    @PatchMapping("/branch-activation")
    public ResponseEntity<ClinicalServiceSummaryResponse> setBranchActivation(
            @RequestParam Long id,
            @Valid @RequestBody BranchActivationInput r
    ) {
        ClinicalServiceSummaryResponse summary =
                clinicalServiceService.setBranchActivation(id, r.getBranchId(), Boolean.TRUE.equals(r.getActive()));
        return ResponseEntity.ok(summary);
    }

    @DeleteMapping
    public ResponseEntity<ClinicalServiceSummaryResponse> delete(@RequestParam Long id) {
        ClinicalServiceSummaryResponse summary = clinicalServiceService.delete(id);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/quick-search")
    public ResponseEntity<List<ClinicalServiceQuickSearchResponse>> quickSearch(
            @RequestParam String name,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) ClinicalServiceCategory category
    ) {
        return ResponseEntity.ok(clinicalServiceService.quickSearch(name, branchId, category));
    }
}
