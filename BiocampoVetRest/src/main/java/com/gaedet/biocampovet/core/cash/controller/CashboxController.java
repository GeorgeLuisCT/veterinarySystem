package com.gaedet.biocampovet.core.cash.controller;

import com.gaedet.biocampovet.core.cash.dto.CashboxResponse;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.cash.dto.CashboxSummaryResponse;
import com.gaedet.biocampovet.core.cash.dto.CloseCashBoxRequest;
import com.gaedet.biocampovet.core.cash.dto.OpenCashboxRequest;
import com.gaedet.biocampovet.core.cash.service.CashboxService;
import com.gaedet.biocampovet.security.annotations.BranchAccessRequired;
import com.gaedet.biocampovet.security.provider.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/cashboxes")
@RequiredArgsConstructor
public class CashboxController {

    private final CashboxService cashBoxService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/open")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Long> openCashBox(@RequestBody @Valid OpenCashboxRequest request) {
        Long userId = jwtTokenProvider.getUserId();
        Long id = cashBoxService.openCashBox(request, userId);
        return ResponseEntity.ok(id);
    }

    @GetMapping("/open/exists")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Boolean> checkOpenCashBox(
            @RequestParam("branchId") Long branchId) {

        boolean exists = cashBoxService.hasOpenCashBox(branchId);
        return ResponseEntity.ok(exists);
    }

    @BranchAccessRequired
    @GetMapping("/open")
    public ResponseEntity<CashboxResponse> getOpenCashBox(
            @RequestParam("branchId") Long branchId) {

        CashboxResponse response = cashBoxService.getCurrentOpenCashBox(branchId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Long> closeCashBox(@RequestBody @Valid CloseCashBoxRequest request) {
        Long userId = jwtTokenProvider.getUserId();
        Long id = cashBoxService.closeCashBox(request, userId);
        return ResponseEntity.ok(id);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<CashboxResponse> getSale(@RequestParam("id") Long id) {
        CashboxResponse response = cashBoxService.getCashBoxById(id);
        return ResponseEntity.ok(response);
    }

    @BranchAccessRequired
    @GetMapping("/list")
    public ResponseEntity<PaginatedResponse<CashboxSummaryResponse>> getCashBoxSummaries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        return ResponseEntity.ok(
                cashBoxService.getCashBoxSummaries(page, size, branchId, startDate, endDate)
        );
    }
}
