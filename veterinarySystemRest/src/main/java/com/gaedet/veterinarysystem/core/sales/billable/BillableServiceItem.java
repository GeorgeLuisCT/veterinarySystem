package com.gaedet.veterinarysystem.core.sales.billable;

import com.gaedet.veterinarysystem.core.sales.enums.BillableServiceType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;

@Value
@Builder
public class BillableServiceItem {
    BillableServiceType type;
    Long itemId;
    Long branchId;
    String description;
    BigDecimal unitPrice;
    BigDecimal quantity;
    BigDecimal taxRate;
    String metadataJson;
}

