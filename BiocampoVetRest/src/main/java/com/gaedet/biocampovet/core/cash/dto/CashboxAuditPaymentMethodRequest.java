package com.gaedet.biocampovet.core.cash.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CashboxAuditPaymentMethodRequest {

    @NotNull(message = "El método de pago es obligatorio")
    private Long paymentMethodId;

    @NotNull(message = "El monto esperado es obligatorio")
    private BigDecimal expectedAmount;

    @NotNull(message = "El monto contado es obligatorio")
    private BigDecimal countedAmount;
}
