package com.gaedet.biocampovet.core.inventory.controller;

import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.dto.*;
import com.gaedet.biocampovet.core.inventory.enums.InventoryMovementType;
import com.gaedet.biocampovet.core.inventory.service.InventoryMovementService;
import com.gaedet.biocampovet.security.annotations.BranchAccessRequired;
import com.gaedet.biocampovet.security.provider.JwtTokenProvider;
import com.gaedet.biocampovet.security.util.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventory-movements")
@RequiredArgsConstructor
public class InventoryMovementController {

    private final InventoryMovementService movementService;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'DEPOSIT')")
    @PostMapping("/purchase")
    public ResponseEntity<InventoryMovementResponse> createPurchase(
            @Valid @RequestBody PurchaseCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(movementService.createPurchase(request, principal.getEmployeeId()));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PostMapping("/transfer")
    public ResponseEntity<InventoryMovementResponse> createTransfer(
            @Valid @RequestBody TransferCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(movementService.createTransfer(request, principal.getEmployeeId()));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PostMapping("/adjustment")
    public ResponseEntity<InventoryMovementResponse> createAdjustment(
            @Valid @RequestBody AdjustmentCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(movementService.createAdjustment(request, principal.getEmployeeId()));
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<InventoryMovementSummaryResponse>> listMovements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long branchId,
            @RequestParam(name = "types", required = false) List<InventoryMovementType> types,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        var resp = movementService.listMovements(page, size, branchId, types, startDate, endDate);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryMovementResponse> getMovementById(@PathVariable Long id) {
        return ResponseEntity.ok(movementService.getMovementById(id));
    }

    @GetMapping("/kardex-history")
    public ResponseEntity<PaginatedResponse<KardexMovementResponse>> getKardexHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam Long productId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        var resp = movementService.getKardexHistory(
                page, size, productId, branchId, batchId, startDate, endDate
        );
        return ResponseEntity.ok(resp);
    }
    @GetMapping("/batches/search")
    public ResponseEntity<List<ProductBatchSearchResponse>> searchBatches(
            @RequestParam Long productId,
            @RequestParam String query
    ) {
        System.out.println("holaaa");
        return ResponseEntity.ok(movementService.searchBatches(productId, query));
    }
}
