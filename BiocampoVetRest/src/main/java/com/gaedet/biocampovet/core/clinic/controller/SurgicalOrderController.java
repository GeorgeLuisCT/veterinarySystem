package com.gaedet.biocampovet.core.clinic.controller;

import com.gaedet.biocampovet.core.clinic.dto.CreateSurgicalOrderRequest;
import com.gaedet.biocampovet.core.clinic.dto.SurgicalOrderResponse;
import com.gaedet.biocampovet.core.clinic.dto.SurgicalOrderSummaryResponse;
import com.gaedet.biocampovet.core.clinic.dto.UpdateSurgicalOrderRequest;
import com.gaedet.biocampovet.core.clinic.enums.SurgicalOrderStatus;
import com.gaedet.biocampovet.core.clinic.service.SurgicalOrderService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/surgical-orders")
@RequiredArgsConstructor
@Validated
public class SurgicalOrderController {

    private final SurgicalOrderService surgicalOrderService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<SurgicalOrderResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) SurgicalOrderStatus status,
            @RequestParam(required = false) Long animalId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long recommendedServiceId
    ) {
        PaginatedResponse<SurgicalOrderResponse> response = surgicalOrderService.list(
                status,
                animalId,
                branchId,
                recommendedServiceId,
                page,
                size
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SurgicalOrderResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(surgicalOrderService.getById(id));
    }

    @PostMapping
    public ResponseEntity<SurgicalOrderResponse> create(
            @Valid @RequestBody CreateSurgicalOrderRequest request
    ) {
        return ResponseEntity.ok(surgicalOrderService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SurgicalOrderResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSurgicalOrderRequest request
    ) {
        return ResponseEntity.ok(surgicalOrderService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        surgicalOrderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pending/by-animal/{animalId}")
    public ResponseEntity<List<SurgicalOrderSummaryResponse>> getPendingByAnimal(@PathVariable Long animalId) {
        return ResponseEntity.ok(surgicalOrderService.getPendingByAnimal(animalId));
    }
}
