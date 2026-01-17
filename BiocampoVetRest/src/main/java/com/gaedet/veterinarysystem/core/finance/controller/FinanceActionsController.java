package com.gaedet.veterinarysystem.core.finance.controller;

import com.gaedet.veterinarysystem.core.finance.dto.request.ExpenseRequest;
import com.gaedet.veterinarysystem.core.finance.dto.request.TransferRequest;
import com.gaedet.veterinarysystem.core.finance.dto.response.AccountMovementResponse;
import com.gaedet.veterinarysystem.core.finance.dto.response.TransferResponse;
import com.gaedet.veterinarysystem.core.finance.service.FinanceActionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/finance")
@RequiredArgsConstructor
@Validated
public class FinanceActionsController {

    private final FinanceActionService financeActionService;

    @PostMapping("/expenses")
    public ResponseEntity<AccountMovementResponse> registerExpense(@Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(financeActionService.registerExpense(request));
    }

    @PostMapping("/transfers")
    public ResponseEntity<TransferResponse> registerTransfer(@Valid @RequestBody TransferRequest request) {
        return ResponseEntity.ok(financeActionService.registerTransfer(request));
    }
}
