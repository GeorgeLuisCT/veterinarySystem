package com.gaedet.biocampovet.core.cash.dto;

import com.gaedet.biocampovet.core.cash.enums.ChasboxMovementReason;
import com.gaedet.biocampovet.core.cash.enums.CashboxMovementType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

// MovementRequest.java
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CashboxMovementRequest {

    @NotNull(message = "El ID de la caja es obligatorio")
    private Long cashboxId;

    @NotNull(message = "El tipo de movimiento es obligatorio")
    private CashboxMovementType type;

    @NotNull(message = "El motivo del movimiento es obligatorio")
    private ChasboxMovementReason reason;

    @NotNull(message = "El ID del método de pago es obligatorio")
    private Long paymentMethodId;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor que cero")
    private BigDecimal amount;

    private String description;
    private String documentReference;
    private String operationNumber;
    private String notes;
}
