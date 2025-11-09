package com.gaedet.biocampovet.core.finance.mapper;

import com.gaedet.biocampovet.core.finance.dto.response.AccountPayableDetailResponse;
import com.gaedet.biocampovet.core.finance.dto.response.AccountPayablePaymentResponse;
import com.gaedet.biocampovet.core.finance.dto.response.AccountPayableSummaryResponse;
import com.gaedet.biocampovet.core.finance.entity.AccountPayable;
import com.gaedet.biocampovet.core.finance.entity.AccountPayablePayment;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public final class AccountPayableMapper {

    private AccountPayableMapper() {
    }

    public static AccountPayableSummaryResponse toSummary(AccountPayable entity) {
        if (entity == null) {
            return null;
        }
        return AccountPayableSummaryResponse.builder()
                .id(entity.getId())
                .supplierId(entity.getSupplier() != null ? entity.getSupplier().getId() : null)
                .supplierName(entity.getSupplier() != null ? entity.getSupplier().getName() : null)
                .description(entity.getDescription())
                .issueDateTime(entity.getIssueDateTime())
                .totalAmount(entity.getTotalAmount())
                .amountPaid(entity.getAmountPaid())
                .status(entity.getStatus())
                .build();
    }

    public static AccountPayableDetailResponse toDetail(AccountPayable entity) {
        if (entity == null) {
            return null;
        }
        var payments = entity.getPayments() == null ? List.<AccountPayablePayment>of() : entity.getPayments();
        return AccountPayableDetailResponse.builder()
                .id(entity.getId())
                .supplierId(entity.getSupplier() != null ? entity.getSupplier().getId() : null)
                .supplierName(entity.getSupplier() != null ? entity.getSupplier().getName() : null)
                .description(entity.getDescription())
                .issueDateTime(entity.getIssueDateTime())
                .totalAmount(entity.getTotalAmount())
                .amountPaid(entity.getAmountPaid())
                .status(entity.getStatus())
                .payments(payments.stream()
                        .sorted(Comparator.comparing(AccountPayablePayment::getPaymentDateTime).reversed())
                        .map(AccountPayableMapper::toPaymentResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    public static AccountPayablePaymentResponse toPaymentResponse(AccountPayablePayment payment) {
        if (payment == null) {
            return null;
        }
        return AccountPayablePaymentResponse.builder()
                .id(payment.getId())
                .amount(payment.getAmount())
                .paymentDateTime(payment.getPaymentDateTime())
                .treasuryAccountId(payment.getTreasuryAccount() != null ? payment.getTreasuryAccount().getId() : null)
                .treasuryAccountName(payment.getTreasuryAccount() != null ? payment.getTreasuryAccount().getName() : null)
                .notes(payment.getNotes())
                .build();
    }
}
