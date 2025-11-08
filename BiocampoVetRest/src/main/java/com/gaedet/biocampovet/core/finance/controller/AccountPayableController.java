package com.gaedet.biocampovet.core.finance.controller;

import com.gaedet.biocampovet.core.finance.dto.request.CreateAccountPayableRequest;
import com.gaedet.biocampovet.core.finance.dto.request.RegisterPaymentRequest;
import com.gaedet.biocampovet.core.finance.dto.response.AccountPayableDetailResponse;
import com.gaedet.biocampovet.core.finance.dto.response.AccountPayableSummaryResponse;
import com.gaedet.biocampovet.core.finance.enums.AccountPayableStatus;
import com.gaedet.biocampovet.core.finance.service.AccountPayableService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/accounts-payable")
@RequiredArgsConstructor
@Validated
public class AccountPayableController {

    private final AccountPayableService accountPayableService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<AccountPayableSummaryResponse>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AccountPayableStatus status,
            @RequestParam(required = false) Long supplierId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(accountPayableService.list(search, status, supplierId, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountPayableDetailResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(accountPayableService.getDetail(id));
    }

    @PostMapping
    public ResponseEntity<AccountPayableSummaryResponse> create(@Valid @RequestBody CreateAccountPayableRequest request) {
        return ResponseEntity.ok(accountPayableService.create(request));
    }

    @PostMapping("/{id}/payments")
    public ResponseEntity<AccountPayableDetailResponse> registerPayment(
            @PathVariable Long id,
            @Valid @RequestBody RegisterPaymentRequest request
    ) {
        return ResponseEntity.ok(accountPayableService.registerPayment(id, request));
    }
}
