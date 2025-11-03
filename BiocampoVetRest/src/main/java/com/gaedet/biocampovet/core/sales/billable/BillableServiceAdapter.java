package com.gaedet.biocampovet.core.sales.billable;

import com.gaedet.biocampovet.core.sales.enums.BillableServiceType;

public interface BillableServiceAdapter {

    BillableServiceType supportsType();

    BillableServiceItem getBillableItem(Long itemId);

    void markAsBilled(Long itemId, Long saleDetailId);

    void markAsUnbilled(Long itemId);
}

