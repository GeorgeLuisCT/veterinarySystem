package com.gaedet.veterinarysystem.core.finance.controller;

import com.gaedet.veterinarysystem.core.finance.dto.request.CreateAccountMovementRequest;
import com.gaedet.veterinarysystem.core.finance.dto.request.CreateTreasuryAccountRequest;
import com.gaedet.veterinarysystem.core.finance.dto.request.UpdateTreasuryAccountRequest;
import com.gaedet.veterinarysystem.core.finance.dto.response.AccountMovementResponse;
import com.gaedet.veterinarysystem.core.finance.dto.response.TreasuryAccountResponse;
import com.gaedet.veterinarysystem.core.finance.service.TreasuryAccountService;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
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
@RequestMapping("/api/treasury-accounts")
@RequiredArgsConstructor
@Validated
public class TreasuryAccountController {

    private final TreasuryAccountService treasuryAccountService;

    @GetMapping
    public ResponseEntity<List<TreasuryAccountResponse>> list() {
        return ResponseEntity.ok(treasuryAccountService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TreasuryAccountResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(treasuryAccountService.getById(id));
    }

    @PostMapping
    public ResponseEntity<TreasuryAccountResponse> create(@Valid @RequestBody CreateTreasuryAccountRequest request) {
        return ResponseEntity.ok(treasuryAccountService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TreasuryAccountResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTreasuryAccountRequest request
    ) {
        return ResponseEntity.ok(treasuryAccountService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        treasuryAccountService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/movements")
    public ResponseEntity<PaginatedResponse<AccountMovementResponse>> listMovements(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(treasuryAccountService.listMovements(id, page, size));
    }

    @PostMapping("/{id}/movements")
    public ResponseEntity<AccountMovementResponse> registerManualMovement(
            @PathVariable Long id,
            @Valid @RequestBody CreateAccountMovementRequest request
    ) {
        return ResponseEntity.ok(treasuryAccountService.registerManualMovement(id, request));
    }
}
