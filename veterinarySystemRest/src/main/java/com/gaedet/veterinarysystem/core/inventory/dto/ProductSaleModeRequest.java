package com.gaedet.veterinarysystem.core.inventory.dto;

import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductSaleModeRequest {

    private Long id;

    @NotNull(message = "El tipo de unidad es obligatorio")
    private ProductUnitType unitType;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.0", message = "El precio debe ser al menos 0.0")
    private BigDecimal price;

    @NotNull(message = "La cantidad relativa es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad relativa debe ser positiva")
    private Double relativeQuantity;

    @NotNull(message = "La unidad relativa es obligatoria")
    private ProductUnitType relativeUnitType;
}
