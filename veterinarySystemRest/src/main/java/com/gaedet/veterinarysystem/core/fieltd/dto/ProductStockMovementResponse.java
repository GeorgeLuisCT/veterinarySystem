package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.fieltd.enums.StockLocationType;
import com.gaedet.veterinarysystem.core.fieltd.enums.StockMovementType;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ProductStockMovementResponse {
    private Long id;
    private StockMovementType movementType;
    private Long productId;
    private String productName;
    private ProductUnitType unit;
    private Integer quantityDelta;
    private StockLocationType fromType;
    private StockLocationType toType;
    private Long vehicleId;
    private Long branchId;
    private Long fieldVisitId;
    private Long createdById;
    private LocalDateTime createdAt;
    private String notes;
}
