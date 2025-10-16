package com.gaedet.biocampovet.core.sales.dto;

import com.gaedet.biocampovet.core.animal.dto.AnimalSummaryResponse;
import com.gaedet.biocampovet.core.inventory.dto.ProductSummaryResponse;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleProductSummaryResponse {
    private Long id;
    private Long productId;
    private String productName;
    private ProductUnitType unitType;
    private Double quantityEquivalent;
    private BigDecimal price;
    private BigDecimal discount;
    private BigDecimal subtotal;
    private boolean applied;
}

