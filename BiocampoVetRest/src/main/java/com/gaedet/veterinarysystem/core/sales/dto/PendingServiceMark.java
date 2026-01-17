package com.gaedet.veterinarysystem.core.sales.dto;

import com.gaedet.veterinarysystem.core.sales.entity.SaleDetail;
import com.gaedet.veterinarysystem.core.sales.enums.BillableServiceType;

public record PendingServiceMark(
        SaleDetail detail,
        BillableServiceType type,
        Long itemId
) {}