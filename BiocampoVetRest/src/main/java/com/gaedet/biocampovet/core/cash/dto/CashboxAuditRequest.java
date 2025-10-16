package com.gaedet.biocampovet.core.cash.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CashboxAuditRequest {

    @NotNull(message = "El ID de la caja es obligatorio")
    private Long cashBoxId;

    @NotNull(message = "Debe especificarse si es final")
    private Boolean isFinal;

    private String observations;

    @NotEmpty(message = "Debe registrar al menos un método de pago")
    private List<CashboxAuditPaymentMethodRequest> paymentMethodAudits;
}

