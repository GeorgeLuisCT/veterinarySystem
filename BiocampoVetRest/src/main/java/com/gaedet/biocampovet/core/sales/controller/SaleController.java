package com.gaedet.biocampovet.core.sales.controller;

import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.sales.dto.SaleRequest;
import com.gaedet.biocampovet.core.sales.dto.SaleResponse;
import com.gaedet.biocampovet.core.sales.dto.SaleSummaryResponse;
import com.gaedet.biocampovet.core.sales.service.SaleService;
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
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Long> createSale(@RequestBody @Valid SaleRequest request) {
        Long branchId = jwtTokenProvider.getBranchId();
        Long employeeId = jwtTokenProvider.getEmployeeId();

        Long response = saleService.createSale(request, branchId, employeeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SaleResponse> getSale(@RequestParam("id") Long id) {
        SaleResponse response = saleService.getSaleById(id);
        return ResponseEntity.ok(response);
    }

    @BranchAccessRequired
    @GetMapping("/list")
    public ResponseEntity<PaginatedResponse<SaleSummaryResponse>> getSalesSummary(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        return ResponseEntity.ok(
                saleService.getSaleSummaries(page, size, branchId, startDate, endDate)
        );
    }

}
