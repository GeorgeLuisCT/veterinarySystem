package com.gaedet.veterinarysystem.core.inventory.controller;

import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.inventory.dto.*;
import com.gaedet.veterinarysystem.core.inventory.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAREHOUSE')")
    @PostMapping("/create")
    public ResponseEntity<SupplierSummaryResponse> createSupplier(@Valid @RequestBody SupplierCreateRequest request) {
        return ResponseEntity.ok(supplierService.createSupplier(request));
    }

    @GetMapping("/get")
    public ResponseEntity<SupplierResponse> getSupplier(@RequestParam Long id) {
        return ResponseEntity.ok(supplierService.getSupplier(id));
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<SupplierSummaryResponse>> getSuppliers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String supplierType,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(supplierService.getSuppliers(page, size, active, supplierType, q));
    }

    @GetMapping("/quick-search")
    public ResponseEntity<List<SupplierQuickSearchResponse>> quickSearchSuppliers(
            @RequestParam String query
    ) {
        return ResponseEntity.ok(supplierService.searchSuppliers(query));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAREHOUSE')")
    @PutMapping("/update")
    public ResponseEntity<SupplierSummaryResponse> updateSupplier(@Valid @RequestBody SupplierUpdateRequest request) {
        return ResponseEntity.ok(supplierService.updateSupplier(request));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAREHOUSE')")
    @DeleteMapping("/soft-delete")
    public ResponseEntity<Map<String, String>> softDeleteSupplier(@RequestParam Long id) {
        supplierService.softDeleteSupplier(id);
        return ResponseEntity.ok(Map.of("message", "Proveedor desactivado correctamente"));
    }

    @PreAuthorize("hasAnyRole(\'ADMIN\', \'MANAGER\')")
    @DeleteMapping("/hard-delete")
    public ResponseEntity<Map<String, String>> hardDeleteSupplier(@RequestParam Long id) {
        supplierService.hardDeleteSupplier(id);
        return ResponseEntity.ok(Map.of("message", "Proveedor eliminado permanentemente"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'WAREHOUSE')")
    @PutMapping("/restore")
    public ResponseEntity<SupplierSummaryResponse> restoreSupplier(@RequestParam Long id) {
        return ResponseEntity.ok(supplierService.restoreSupplier(id));
    }
}