package com.gaedet.veterinarysystem.core.sales.dto.response;

import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import com.gaedet.veterinarysystem.core.sales.enums.BillableServiceType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class SaleDetailResponse {
    Long id;
    String description;
    BigDecimal unitPrice;
    BigDecimal quantity;
    BigDecimal lineSubtotal;
    BigDecimal taxRate;
    BigDecimal taxAmount;
    Long productId;
    Long productBatchId;
    Long saleModeId;
    ProductUnitType unitType;
    Double quantityEquivalent;
    BillableServiceType serviceType;
    Long serviceItemId;
    String metadataJson;
}
