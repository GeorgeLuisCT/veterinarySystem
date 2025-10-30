package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SaleModeSummary {
    private Long id;
    private ProductUnitType unitType;
    private BigDecimal relativeQuantity;
    private BigDecimal price;
    private boolean isBaseMode;
}