package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovementProductResponse {
    private Long id;
    private ProductSummaryResponse product;
    private ProductBatchSummaryResponse batch;
    private Double quantity;
    private ProductUnitType unitType;
    private BigDecimal unitCost;
}
