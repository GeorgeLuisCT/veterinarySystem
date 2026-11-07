package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.clinic.billable.ClinicalAttentionBillingCloser;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalAttention;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalServiceItem;
import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalAttentionStatus;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClinicalAttentionLifecycleTest {

    private ClinicalServiceItem item(Long saleDetailId) {
        ClinicalServiceItem item = new ClinicalServiceItem();
        item.setSaleDetailId(saleDetailId);
        return item;
    }

    private ClinicalAttention attention(ClinicalAttentionStatus status, ClinicalServiceItem... items) {
        ClinicalAttention ca = new ClinicalAttention();
        ca.setStatus(status);
        Set<ClinicalServiceItem> set = new HashSet<>(Set.of(items));
        ca.setServiceItems(set);
        return ca;
    }

    @Test
    void closesWhenEverythingIsBilled() {
        ClinicalAttention ca = attention(ClinicalAttentionStatus.READY_TO_BILL, item(1L), item(2L));

        new ClinicalAttentionBillingCloser().onBillingChanged(ca);

        assertEquals(ClinicalAttentionStatus.CLOSED, ca.getStatus());
    }

    @Test
    void staysReadyToBillWhileChargesArePending() {
        ClinicalAttention ca = attention(ClinicalAttentionStatus.READY_TO_BILL, item(1L), item(null));

        new ClinicalAttentionBillingCloser().onBillingChanged(ca);

        assertEquals(ClinicalAttentionStatus.READY_TO_BILL, ca.getStatus());
    }

    @Test
    void reopensToReadyToBillWhenASaleIsVoided() {
        ClinicalAttention ca = attention(ClinicalAttentionStatus.CLOSED, item(1L), item(null));

        new ClinicalAttentionBillingCloser().onBillingChanged(ca);

        assertEquals(ClinicalAttentionStatus.READY_TO_BILL, ca.getStatus());
    }

    @Test
    void doesNotCloseAnAttentionThatIsNotReadyToBill() {
        ClinicalAttention ca = attention(ClinicalAttentionStatus.IN_PROGRESS, item(1L));

        new ClinicalAttentionBillingCloser().onBillingChanged(ca);

        assertEquals(ClinicalAttentionStatus.IN_PROGRESS, ca.getStatus());
    }
}
