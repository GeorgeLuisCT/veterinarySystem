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
public class OpenCashboxRequest {

    @NotNull(message = "La sucursal es obligatoria")
    private Long branchId;

    @NotNull(message = "El monto inicial es obligatorio")
    @DecimalMin(value = "0.00", message = "El monto inicial no puede ser negativo")
    private BigDecimal initialAmount;

}
