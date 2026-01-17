package com.gaedet.veterinarysystem.core.cashbox.dto.response;

import com.gaedet.veterinarysystem.core.sales.enums.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CashSessionSalePaymentResponse(
        Long paymentId,
        Long saleId,
        LocalDateTime paidAt,
        PaymentMethod paymentMethod,
        BigDecimal amountPaid,
        String customerName,
        String saleDocumentNumber,
        BigDecimal saleGrandTotal
) {}