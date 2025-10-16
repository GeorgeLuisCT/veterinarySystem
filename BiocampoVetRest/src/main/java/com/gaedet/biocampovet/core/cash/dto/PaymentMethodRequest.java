package com.gaedet.biocampovet.core.cash.dto;

import lombok.*;

import javax.validation.constraints.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethodRequest {

    @NotBlank(message = "El nombre no puede estar vacío")
    @Size(max = 100, message = "El nombre no debe superar los 100 caracteres")
    @Pattern(regexp = "^[^§¶¤¬]+$", message = "El nombre no puede contener caracteres especiales como '§', '¶', '¤', '¬'")
    private String name;

    @Size(max = 255, message = "La descripción no debe superar los 255 caracteres")
    private String description;

    @DecimalMin(value = "0.00", inclusive = true, message = "El porcentaje extra debe ser mayor o igual a 0")
    @DecimalMax(value = "100.00", inclusive = true, message = "El porcentaje extra no puede superar el 100%")
    private BigDecimal percentageExtra;

    @DecimalMin(value = "0.00", inclusive = true, message = "El porcentaje de descuento debe ser mayor o igual a 0")
    @DecimalMax(value = "100.00", inclusive = true, message = "El porcentaje de descuento no puede superar el 100%")
    private BigDecimal percentageDiscount;

    private Boolean isActive;
}