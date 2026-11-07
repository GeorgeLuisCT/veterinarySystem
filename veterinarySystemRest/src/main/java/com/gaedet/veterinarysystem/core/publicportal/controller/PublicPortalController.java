package com.gaedet.veterinarysystem.core.publicportal.controller;

import com.gaedet.veterinarysystem.core.branches.dto.BranchResponse;
import com.gaedet.veterinarysystem.core.branches.dto.PublicCompanyResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.history.ClinicalHistoryDetailResponse;
import com.gaedet.veterinarysystem.core.publicportal.dto.PublicAnimalSummaryResponse;
import com.gaedet.veterinarysystem.core.publicportal.dto.PublicAppointmentRequest;
import com.gaedet.veterinarysystem.core.publicportal.dto.PublicAppointmentResponse;
import com.gaedet.veterinarysystem.core.publicportal.service.PublicPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicPortalController {

    private final PublicPortalService publicPortalService;
    private final com.gaedet.veterinarysystem.core.publicportal.service.PublicPortalRateLimiter rateLimiter;

    /** IP real del cliente (nginx envía X-Forwarded-For); sirve solo para frenar abuso, no para autorizar. */
    private static String clientIp(javax.servlet.http.HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void throttle(javax.servlet.http.HttpServletRequest request, String documentNumber) {
        rateLimiter.check("ip:" + clientIp(request));
        if (documentNumber != null && !documentNumber.isBlank()) {
            rateLimiter.check("doc:" + documentNumber.trim());
        }
    }

    @GetMapping("/clinical-history/animals")
    public ResponseEntity<List<PublicAnimalSummaryResponse>> getAnimalsForClientHistory(
            @RequestParam Long documentTypeId,
            @RequestParam String documentNumber,
            javax.servlet.http.HttpServletRequest httpRequest
    ) {
        throttle(httpRequest, documentNumber);
        List<PublicAnimalSummaryResponse> animals = publicPortalService.getAnimalsForClient(documentTypeId, documentNumber);
        return ResponseEntity.ok(animals);
    }

    @GetMapping("/branches")
    public ResponseEntity<List<BranchResponse>> getBranches() {
        List<BranchResponse> branches = publicPortalService.getPublicBranches();
        return ResponseEntity.ok(branches);
    }

    @GetMapping("/clinical-history")
    public ResponseEntity<ClinicalHistoryDetailResponse> getClinicalHistory(
            @RequestParam Long documentTypeId,
            @RequestParam String documentNumber,
            @RequestParam Long animalId,
            javax.servlet.http.HttpServletRequest httpRequest
    ) {
        throttle(httpRequest, documentNumber);
        ClinicalHistoryDetailResponse history = publicPortalService.getClinicalHistory(documentTypeId, documentNumber, animalId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/company")
    public ResponseEntity<PublicCompanyResponse> getCompanyInfo() {
        PublicCompanyResponse companyInfo = publicPortalService.getCompanyInfo();
        return ResponseEntity.ok(companyInfo);
    }

    @PostMapping("/appointments/request")
    public ResponseEntity<PublicAppointmentResponse> requestAppointment(
            @Valid @RequestBody PublicAppointmentRequest request,
            javax.servlet.http.HttpServletRequest httpRequest
    ) {
        throttle(httpRequest, request.getDocumentNumber());
        PublicAppointmentResponse response = publicPortalService.createAppointmentRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
