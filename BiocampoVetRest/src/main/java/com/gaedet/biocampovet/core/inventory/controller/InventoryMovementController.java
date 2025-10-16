package com.gaedet.biocampovet.core.inventory.controller;

import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.dto.InventoryMovementRequest;
import com.gaedet.biocampovet.core.inventory.dto.InventoryMovementResponse;
import com.gaedet.biocampovet.core.inventory.dto.InventoryMovementSummaryResponse;
import com.gaedet.biocampovet.core.inventory.enums.InventoryMovementType;
import com.gaedet.biocampovet.core.inventory.service.InventoryMovementService;
import com.gaedet.biocampovet.security.annotations.BranchAccessRequired;
import com.gaedet.biocampovet.security.provider.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventory-movements")
@RequiredArgsConstructor
public class InventoryMovementController {

    private final InventoryMovementService inventoryMovementService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Long> createMovement(@RequestBody @Valid InventoryMovementRequest request) {
        Long sourceBranchId = jwtTokenProvider.getBranchId();
        Long employeeId = jwtTokenProvider.getUserId();
        Long response = inventoryMovementService.createMovement(request, sourceBranchId, employeeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<InventoryMovementResponse> getMovement(@RequestParam("id") Long id) {
        InventoryMovementResponse response = inventoryMovementService.getMovementById(id);
        return ResponseEntity.ok(response);
    }

    @BranchAccessRequired
    @GetMapping("/list-filter")
    public ResponseEntity<PaginatedResponse<InventoryMovementSummaryResponse>> getMovementsByTypes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(name = "types") List<InventoryMovementType> types
    ) {
        Long branchId = jwtTokenProvider.getBranchId();
        PaginatedResponse<InventoryMovementSummaryResponse> response =
                inventoryMovementService.getMovementSummariesByTypes(page, size, branchId, types, startDate, endDate);
        return ResponseEntity.ok(response);
    }
}
