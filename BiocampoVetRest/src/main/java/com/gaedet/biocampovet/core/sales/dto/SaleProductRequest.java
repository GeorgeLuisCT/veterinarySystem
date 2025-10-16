package com.gaedet.biocampovet.core.sales.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleProductRequest {

    @NotNull(message = "El producto es obligatorio")
    private Long productId;

    @NotNull(message = "El tipo de unidad es obligatorio")
    private ProductUnitType unitType;

    @NotNull(message = "La cantidad equivalente es obligatoria")
    @DecimalMin(value = "0.0", inclusive = false, message = "La cantidad equivalente debe ser mayor a 0.0")
    private Double quantityEquivalent;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a 0.0")
    private BigDecimal price;

    @DecimalMin(value = "0.0", message = "El descuento no puede ser negativo")
    private BigDecimal discount;

    @NotNull(message = "El subtotal es obligatorio")
    @DecimalMin(value = "0.0", inclusive = false, message = "El subtotal debe ser mayor a 0.0")
    private BigDecimal subtotal;

    private Long animalId;

    @NotNull(message = "Debe indicarse si se aplicó o no")
    private Boolean applied;
}