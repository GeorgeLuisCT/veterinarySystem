package com.gaedet.biocampovet.core.sales.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalePaymentRequest {

    @NotBlank(message = "El método de pago es obligatorio")
    private String methodId;

    @NotNull(message = "El monto es obligatorio")
    @Min(value = 1, message = "El monto debe ser mayor a 0")
    private Double amount;

    private String description;
    private String operationNumber;
    private String documentReference;
    private String receivedBy;
    private String notes;
    private String detail;
}
