package com.gaedet.biocampovet.core.sales.dto.response;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.sales.enums.BillableServiceType;
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
