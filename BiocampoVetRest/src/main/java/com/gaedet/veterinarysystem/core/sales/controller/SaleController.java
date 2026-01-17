package com.gaedet.veterinarysystem.core.sales.controller;

import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.sales.billable.BillableServiceItem;
import com.gaedet.veterinarysystem.core.sales.dto.FinalizeSaleRequest;
import com.gaedet.veterinarysystem.core.sales.dto.UpdateSaleRequest;
import com.gaedet.veterinarysystem.core.sales.dto.request.CreateSaleRequest;
import com.gaedet.veterinarysystem.core.sales.dto.request.SaleItemRequest;
import com.gaedet.veterinarysystem.core.sales.dto.request.SalePaymentRequest;
import com.gaedet.veterinarysystem.core.sales.dto.request.VoidSaleRequest;
import com.gaedet.veterinarysystem.core.sales.dto.response.SaleResponse;
import com.gaedet.veterinarysystem.core.sales.dto.response.SaleSummaryResponse;
import com.gaedet.veterinarysystem.core.sales.enums.SaleStatus;
import com.gaedet.veterinarysystem.core.sales.enums.SalesDocumentType;
import com.gaedet.veterinarysystem.core.sales.service.SaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@Validated
public class SaleController {

    private final SaleService saleService;

    @PostMapping
    public ResponseEntity<SaleResponse> createSale(@RequestBody @Valid CreateSaleRequest request) {
        return ResponseEntity.ok(saleService.createSale(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SaleResponse> updateSale(
            @PathVariable Long id,
            @RequestBody @Valid UpdateSaleRequest request
    ) {
        return ResponseEntity.ok(saleService.updateSale(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleResponse> getSale(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.getSale(id));
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<SaleSummaryResponse>> listSales(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long sellerId,
            @RequestParam(required = false) SaleStatus status,
            @RequestParam(required = false) SalesDocumentType documentType,
            @RequestParam(required = false) String documentNumber,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        PaginatedResponse<SaleSummaryResponse> response = saleService.listSales(
                page, size, q, branchId, customerId, sellerId, status,
                documentType, documentNumber, startDate, endDate
        );
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

    @PostMapping("/{id}/details")
    public ResponseEntity<SaleResponse> addDetailToSale(
            @PathVariable Long id,
            @RequestBody @Valid SaleItemRequest request
    ) {
        return ResponseEntity.ok(saleService.addDetailToSale(id, request));
    }

    @PutMapping("/{id}/details/{detailId}")
    public ResponseEntity<SaleResponse> updateSaleDetail(
            @PathVariable Long id,
            @PathVariable Long detailId,
            @RequestBody @Valid SaleItemRequest request
    ) {
        return ResponseEntity.ok(saleService.updateSaleDetail(id, detailId, request));
    }

    @DeleteMapping("/{id}/details/{detailId}")
    public ResponseEntity<Void> deleteSaleDetail(
            @PathVariable Long id,
            @PathVariable Long detailId
    ) {
        saleService.deleteSaleDetail(id, detailId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<SaleResponse> addPaymentToSale(
            @PathVariable Long id,
            @RequestBody @Valid SalePaymentRequest request
    ) {
        return ResponseEntity.ok(saleService.addPaymentToSale(id, request));
    }

    @PutMapping("/{id}/payments/{paymentId}")
    public ResponseEntity<SaleResponse> updateSalePayment(
            @PathVariable Long id,
            @PathVariable Long paymentId,
            @RequestBody @Valid SalePaymentRequest request
    ) {
        return ResponseEntity.ok(saleService.updateSalePayment(id, paymentId, request));
    }

    @DeleteMapping("/{id}/payments/{paymentId}")
    public ResponseEntity<Void> deleteSalePayment(
            @PathVariable Long id,
            @PathVariable Long paymentId
    ) {
        saleService.deleteSalePayment(id, paymentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/finalize")
    public ResponseEntity<SaleResponse> finalizeSale(
            @PathVariable Long id,
            @RequestBody @Valid FinalizeSaleRequest request
    ) {
        return ResponseEntity.ok(saleService.finalizeSale(id, request));
    }
}
