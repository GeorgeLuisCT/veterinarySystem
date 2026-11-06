package com.gaedet.veterinarysystem.core.clinic.billable;

import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalAttention;
import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalAttentionStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.LabRequestItemStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.LabRequestStatus;
import org.springframework.stereotype.Component;

/**
 * Sincroniza el estado de la atención clínica con el cobro: cuando todos sus cargos están cobrados pasa a
 * CLOSED; si se anula una venta y vuelve a haber cargos pendientes, regresa a READY_TO_BILL.
 */
@Component
public class ClinicalAttentionBillingCloser {

    public void onBillingChanged(ClinicalAttention attention) {
        if (attention == null) {
            return;
        }
        boolean pending = hasPendingCharges(attention);
        if (!pending && attention.getStatus() == ClinicalAttentionStatus.READY_TO_BILL) {
            attention.setStatus(ClinicalAttentionStatus.CLOSED);
        } else if (pending && attention.getStatus() == ClinicalAttentionStatus.CLOSED) {
            attention.setStatus(ClinicalAttentionStatus.READY_TO_BILL);
        }
    }

    private boolean hasPendingCharges(ClinicalAttention attention) {
        boolean pendingServices = attention.getServiceItems().stream().anyMatch(i -> i.getSaleDetailId() == null);
        boolean pendingLabs = attention.getLaboratoryRequests().stream()
                .filter(r -> r.getStatus() != LabRequestStatus.CANCELED)
                .flatMap(r -> r.getItems().stream())
                .anyMatch(i -> i.getSaleDetailId() == null && i.getStatus() != LabRequestItemStatus.CANCELED);
        return pendingServices || pendingLabs;
    }
}
