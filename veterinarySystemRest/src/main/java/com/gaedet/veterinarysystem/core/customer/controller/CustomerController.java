package com.gaedet.veterinarysystem.core.customer.controller;

import com.gaedet.veterinarysystem.core.customer.dto.*;
import com.gaedet.veterinarysystem.core.customer.service.CustomerService;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.security.provider.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final JwtTokenProvider jwtTokenProvider;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PostMapping("/create")
    public ResponseEntity<CustomerSummaryResponse> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        return ResponseEntity.ok(customerService.createCustomer(request));
    }

    @GetMapping("/get")
    public ResponseEntity<CustomerResponse> getCustomer(@RequestParam Long id) {
        return ResponseEntity.ok(customerService.getCustomer(id));
    }

    @GetMapping("/list")
    public ResponseEntity<PaginatedResponse<CustomerSummaryResponse>> getCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam boolean active,
            @RequestParam(required = false) String query
    ) {
        return ResponseEntity.ok(customerService.getCustomers(page, size, active, query));
    }

    @GetMapping("/quick-search")
    public ResponseEntity<List<CustomerQuickSearchResponse>> searchCustomersByName(@RequestParam String name) {
        return ResponseEntity.ok(customerService.searchCustomersByName(name));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping("/update")
    public ResponseEntity<CustomerSummaryResponse> updateCustomer(@Valid @RequestBody CustomerUpdateRequest request) {
        return ResponseEntity.ok(customerService.updateCustomer(request));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @DeleteMapping("/soft-delete")
    public ResponseEntity<Map<String, String>> softDeleteCustomer(@RequestParam Long id) {
        customerService.softDeleteCustomer(id);
        return ResponseEntity.ok(Map.of("message", "Cliente deshabilitado correctamente"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @DeleteMapping("/hard-delete")
    public ResponseEntity<Map<String, String>> hardDeleteCustomer(@RequestParam Long id) {
        customerService.hardDeleteCustomer(id);
        return ResponseEntity.ok(Map.of("message", "Cliente eliminado permanentemente"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PutMapping("/restore")
    public ResponseEntity<CustomerSummaryResponse> restoreCustomer(@RequestParam Long id) {
        CustomerSummaryResponse response = customerService.restoreCustomer(id);
        return ResponseEntity.ok(response);
    }
}

