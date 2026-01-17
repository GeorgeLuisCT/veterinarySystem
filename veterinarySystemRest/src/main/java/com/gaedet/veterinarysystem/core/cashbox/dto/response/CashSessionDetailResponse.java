package com.gaedet.veterinarysystem.core.cashbox.dto.response;

import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class CashSessionDetailResponse {
    boolean open;
    CashSessionSummaryResponse session;
    @Singular
    List<CashMovementResponse> movements;
    @Singular("breakdownItem")
    List<CashboxPaymentBreakdownResponse> paymentBreakdown;

    List<CashSessionSalePaymentResponse> salePayments;
}
