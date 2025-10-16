package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
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

    @NotNull(message = "El modo de venta es obligatorio")
    private ProductUnitType unitType;

    @NotNull(message = "La cantidad equivalente es obligatoria")
    @DecimalMin(value = "0.0", message = "La cantidad equivalente debe ser al menos 0.0")
    private Double quantityEquivalent;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.0", message = "El precio debe ser al menos 0.0")
    private BigDecimal price;
}
