package com.gaedet.biocampovet.core.sales.dto;

import com.gaedet.biocampovet.core.sales.entity.SaleDetail;
import com.gaedet.biocampovet.core.sales.enums.BillableServiceType;

public record PendingServiceMark(
        SaleDetail detail,
        BillableServiceType type,
        Long itemId
) {}