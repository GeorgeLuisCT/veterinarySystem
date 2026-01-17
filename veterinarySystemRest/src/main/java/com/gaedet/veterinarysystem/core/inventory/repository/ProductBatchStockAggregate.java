package com.gaedet.veterinarysystem.core.inventory.repository;

import java.math.BigDecimal;

public interface ProductBatchStockAggregate {
    Long getBatchId();
    BigDecimal getTotalStock();
}