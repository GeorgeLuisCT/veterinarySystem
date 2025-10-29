package com.gaedet.biocampovet.core.inventory.repository;

import java.math.BigDecimal;

public interface ProductBranchStockAggregate {
    Long getProductId();
    Long getBranchId();
    BigDecimal getTotalStock();
}