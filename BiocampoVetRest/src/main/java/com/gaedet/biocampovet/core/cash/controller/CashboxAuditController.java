package com.gaedet.biocampovet.core.cash.controller;

import com.gaedet.biocampovet.core.cash.dto.CashboxAuditRequest;
import com.gaedet.biocampovet.core.cash.service.CashboxAuditService;
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
@RequestMapping("/api/cashbox-audits")
@RequiredArgsConstructor
public class CashboxAuditController {

    private final CashboxAuditService cashBoxAuditService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Long> registerAudit(@RequestBody @Valid CashboxAuditRequest request) {
        Long userId = jwtTokenProvider.getUserId();
        Long id = cashBoxAuditService.registerAudit(request, userId);
        return ResponseEntity.ok(id);
    }
}

