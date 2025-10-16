package com.gaedet.biocampovet.core.sales.dto;

import com.gaedet.biocampovet.core.animal.dto.AnimalResponse;
import com.gaedet.biocampovet.core.inventory.dto.ProductResponse;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleProductResponse {
    private Long id;
    private ProductResponse product;
    private ProductUnitType unitType;
    private Double quantityEquivalent;
    private BigDecimal price;
    private BigDecimal discount;
    private BigDecimal subtotal;
    private AnimalResponse animal;
    private boolean applied;
}