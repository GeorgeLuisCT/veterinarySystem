package com.gaedet.biocampovet.core.cash.controller;

import com.gaedet.biocampovet.core.cash.dto.CashboxMovementRequest;
import com.gaedet.biocampovet.core.cash.service.MovementService;
import com.gaedet.biocampovet.security.provider.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/cashbox-movements")
@RequiredArgsConstructor
public class CashboxMovementController {

    private final MovementService movementService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Long> registerMovement(@RequestBody @Valid CashboxMovementRequest request) {
        Long userId = jwtTokenProvider.getUserId();
        Long id = movementService.registerMovement(request, userId);
        return ResponseEntity.ok(id);
    }
}

