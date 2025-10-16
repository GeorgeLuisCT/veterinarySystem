package com.gaedet.biocampovet.core.cash.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CloseCashBoxRequest {

    @NotNull(message = "El ID de la caja es obligatorio")
    private Long cashboxId;

    @NotNull(message = "El monto físico contado es obligatorio")
    @DecimalMin(value = "0.00", message = "El monto físico no puede ser negativo")
    private BigDecimal physicalAmount;

    private String closingObservations;

}
