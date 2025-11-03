package com.gaedet.biocampovet.core.sales.controller;

import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.sales.billable.BillableServiceItem;
import com.gaedet.biocampovet.core.sales.dto.request.CreateSaleRequest;
import com.gaedet.biocampovet.core.sales.dto.request.VoidSaleRequest;
import com.gaedet.biocampovet.core.sales.dto.response.SaleResponse;
import com.gaedet.biocampovet.core.sales.dto.response.SaleSummaryResponse;
import com.gaedet.biocampovet.core.sales.service.SaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@Validated
public class SaleController {

    private final SaleService saleService;

    @PostMapping
    public ResponseEntity<SaleResponse> saveSale(@RequestBody @Valid CreateSaleRequest request) {
        return ResponseEntity.ok(saleService.saveSale(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleResponse> getSale(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.getSale(id));
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<SaleSummaryResponse>> listSales(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1));
        Page<SaleSummaryResponse> paged = saleService.listSales(pageable);
        PaginatedResponse<SaleSummaryResponse> response = PaginatedResponse.<SaleSummaryResponse>builder()
                .content(paged.getContent())
                .totalPages(paged.getTotalPages())
                .totalElements(paged.getTotalElements())
                .currentPage(paged.getNumber())
                .pageSize(paged.getSize())
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/void")
    public ResponseEntity<SaleResponse> voidSale(
            @PathVariable Long id,
            @RequestBody @Valid VoidSaleRequest request
    ) {
        return ResponseEntity.ok(saleService.voidSale(id, request));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<SaleSummaryResponse>> listPendingSales(
            @RequestParam(required = false) Long branchId
    ) {
        return ResponseEntity.ok(saleService.listPendingSales(branchId));
    }

    @GetMapping("/billable-items")
    public ResponseEntity<List<BillableServiceItem>> listBillableItems(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long attentionId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(saleService.listBillableItems(branchId, attentionId, patientId, q));
    }
}
