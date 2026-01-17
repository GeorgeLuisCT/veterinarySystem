package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AdjustVehicleStockRequest {
    @NotNull
    private Long vehicleId;
    @NotNull
    private Long productId;
    @NotNull
    private Integer quantityDelta;
    private ProductUnitType unit;
    private String notes;
}
