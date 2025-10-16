package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryMovementProductResponse {
    private Long id;
    private ProductResponse product;
    private Double quantity;
    private ProductUnitType productUnitType;
    private BigDecimal unitCost;
    private String batchNumber;
    private LocalDate expirationDate;
}
