package com.gaedet.biocampovet.core.inventory.repository;

import java.math.BigDecimal;

public interface ProductStockAggregate {
    Long getProductId();
    BigDecimal getTotalStock();
}