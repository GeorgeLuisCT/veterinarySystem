package com.gaedet.veterinarysystem.core.inventory.repository;

import java.math.BigDecimal;

public interface ProductStockAggregate {
    Long getProductId();
    BigDecimal getTotalStock();
}