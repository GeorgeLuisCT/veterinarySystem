package com.gaedet.biocampovet.core.cash.controller;

import com.gaedet.biocampovet.core.cash.dto.PaymentMethodRequest;
import com.gaedet.biocampovet.core.cash.dto.PaymentMethodResponse;
import com.gaedet.biocampovet.core.cash.service.PaymentMethodService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/sales/payment-methods")
public class PaymentMethodController {

    private final PaymentMethodService paymentMethodService;

    public PaymentMethodController(PaymentMethodService paymentMethodService) {
        this.paymentMethodService = paymentMethodService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentMethodResponse>> getAll() {
        return ResponseEntity.ok(paymentMethodService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<PaymentMethodResponse>> getAllActive() {
        return ResponseEntity.ok(paymentMethodService.getAllActive());
    }

    @GetMapping("/get")
    public ResponseEntity<PaymentMethodResponse> getById(@RequestParam Long id) {
        PaymentMethodResponse method = paymentMethodService.getById(id);
        return method != null ? ResponseEntity.ok(method) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<PaymentMethodResponse> save(@Valid @RequestBody PaymentMethodRequest request) {
        return ResponseEntity.ok(paymentMethodService.save(request));
    }

    @PutMapping("/update-name")
    public ResponseEntity<PaymentMethodResponse> updateName(@RequestParam Long id, @RequestParam String name) {
        PaymentMethodResponse updated = paymentMethodService.updateName(id, name);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/soft")
    public ResponseEntity<Void> softDelete(@RequestParam Long id) {
        return paymentMethodService.softDelete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/hard")
    public ResponseEntity<Void> hardDelete(@RequestParam Long id) {
        return paymentMethodService.hardDelete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PutMapping("/restore")
    public ResponseEntity<Void> restore(@RequestParam Long id) {
        return paymentMethodService.restore(id) ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
}