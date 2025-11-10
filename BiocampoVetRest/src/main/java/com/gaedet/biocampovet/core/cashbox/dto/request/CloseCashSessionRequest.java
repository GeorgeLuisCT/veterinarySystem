package com.gaedet.biocampovet.core.cashbox.dto.request;

import com.gaedet.biocampovet.core.sales.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloseCashSessionRequest {

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true)
    private BigDecimal countedClosingAmount;

    private String notes;

    @Builder.Default
    private List<PaymentTransferAllocation> paymentTransfers = List.of();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentTransferAllocation {
        @NotNull
        private PaymentMethod paymentMethod;
        private Long treasuryAccountId;
    }
}
