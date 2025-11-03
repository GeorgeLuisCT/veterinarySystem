package com.gaedet.biocampovet.core.payments.controller;

import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.payments.dto.request.CloseCashSessionRequest;
import com.gaedet.biocampovet.core.payments.dto.request.OpenCashSessionRequest;
import com.gaedet.biocampovet.core.payments.dto.request.RegisterCashMovementRequest;
import com.gaedet.biocampovet.core.payments.dto.response.CashSessionDetailResponse;
import com.gaedet.biocampovet.core.payments.dto.response.CashSessionHistoryResponse;
import com.gaedet.biocampovet.core.payments.dto.response.CashSessionSummaryResponse;
import com.gaedet.biocampovet.core.payments.service.CashSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/cash-sessions")
@RequiredArgsConstructor
@Validated
public class CashSessionController {

    private final CashSessionService cashSessionService;

    @PostMapping
    public ResponseEntity<CashSessionSummaryResponse> openSession(@RequestBody @Valid OpenCashSessionRequest request) {
        return ResponseEntity.ok(cashSessionService.openSession(request));
    }

    @GetMapping("/active")
    public ResponseEntity<CashSessionDetailResponse> getActiveSession(
            @RequestParam Long branchId,
            @RequestParam Long cashierId
    ) {
        return ResponseEntity.ok(cashSessionService.getActiveSession(branchId, cashierId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CashSessionDetailResponse> getSessionDetail(@PathVariable Long id) {
        return ResponseEntity.ok(cashSessionService.getSessionDetail(id));
    }

    @PostMapping("/{id}/movements")
    public ResponseEntity<CashSessionDetailResponse> registerMovement(
            @PathVariable Long id,
            @RequestBody @Valid RegisterCashMovementRequest request
    ) {
        return ResponseEntity.ok(cashSessionService.registerMovement(id, request));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<CashSessionSummaryResponse> closeSession(
            @PathVariable Long id,
            @RequestBody @Valid CloseCashSessionRequest request
    ) {
        return ResponseEntity.ok(cashSessionService.closeSession(id, request));
    }

    @GetMapping("/history")
    public ResponseEntity<PaginatedResponse<CashSessionHistoryResponse>> listHistory(
            @RequestParam(required = false) Long branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<CashSessionHistoryResponse> paged = cashSessionService.listHistory(branchId, page, size);
        PaginatedResponse<CashSessionHistoryResponse> response = PaginatedResponse.<CashSessionHistoryResponse>builder()
                .content(paged.getContent())
                .totalPages(paged.getTotalPages())
                .totalElements(paged.getTotalElements())
                .currentPage(paged.getNumber())
                .pageSize(paged.getSize())
                .build();
        return ResponseEntity.ok(response);
    }
}

