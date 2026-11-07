package com.gaedet.veterinarysystem.core.sales.billable;

import com.gaedet.veterinarysystem.core.sales.enums.BillableServiceType;

import java.util.List;

public interface BillableServiceAdapter {

    BillableServiceType supportsType();

    BillableServiceItem getBillableItem(Long itemId);

    void markAsBilled(Long itemId, Long saleDetailId);

    void markAsUnbilled(Long itemId);

    /** Ítems de este tipo pendientes de cobro, filtrados por sucursal / atención / paciente / texto. */
    List<BillableServiceItem> listPending(Long branchId, Long attentionId, Long patientId, String query);
}

