package com.gaedet.biocampovet.core.sales.billable;

import com.gaedet.biocampovet.core.sales.enums.BillableServiceType;
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

