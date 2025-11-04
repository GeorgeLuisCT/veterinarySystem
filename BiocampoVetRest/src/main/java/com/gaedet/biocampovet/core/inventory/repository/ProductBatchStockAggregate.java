package com.gaedet.biocampovet.core.inventory.repository;

import java.math.BigDecimal;

public interface ProductBatchStockAggregate {
    Long getBatchId();
    BigDecimal getTotalStock();
}