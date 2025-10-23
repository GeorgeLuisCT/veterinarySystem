package com.gaedet.biocampovet.core.fieltd.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class VehicleStockResponse {
    private Long id;
    private Long vehicleId;
    private Long productId;
    private String productName;
    private String sku;
    private ProductUnitType unit;
    private Integer quantity;
}
