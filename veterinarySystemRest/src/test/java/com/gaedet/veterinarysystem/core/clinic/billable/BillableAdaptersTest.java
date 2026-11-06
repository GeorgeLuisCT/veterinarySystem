package com.gaedet.veterinarysystem.core.clinic.billable;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.clinic.entity.Attentions;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalAttention;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalService;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalServiceItem;
import com.gaedet.veterinarysystem.core.clinic.entity.GroomingSession;
import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalAttentionStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.GroomingStatus;
import com.gaedet.veterinarysystem.core.clinic.repository.ClinicalServiceItemRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.GroomingSessionRepository;
import com.gaedet.veterinarysystem.core.sales.billable.BillableServiceItem;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BillableAdaptersTest {

    @Mock ClinicalServiceItemRepository clinicalItemRepository;
    @Mock GroomingSessionRepository groomingRepository;

    private ClinicalServiceItem clinicalItem(ClinicalAttentionStatus status, Long saleDetailId) {
        Branch branch = new Branch();
        branch.setId(1L);
        Animal animal = new Animal();
        animal.setId(3L);
        animal.setName("Luna");
        Attentions attention = new Attentions();
        attention.setId(8L);
        attention.setBranch(branch);
        attention.setAnimal(animal);
        ClinicalAttention clinicalAttention = new ClinicalAttention();
        clinicalAttention.setId(4L);
        clinicalAttention.setAttention(attention);
        clinicalAttention.setStatus(status);
        ClinicalService service = new ClinicalService();
        service.setName("Vacuna triple");
        ClinicalServiceItem item = new ClinicalServiceItem();
        item.setId(11L);
        item.setClinicalAttention(clinicalAttention);
        item.setClinicalService(service);
        item.setUnitPrice(new BigDecimal("45.00"));
        item.setQuantity(BigDecimal.ONE);
        item.setSaleDetailId(saleDetailId);
        return item;
    }

    private ClinicalServiceItemBillableAdapter clinicalAdapter() {
        return new ClinicalServiceItemBillableAdapter(clinicalItemRepository, new ObjectMapper());
    }

    @Test
    void readyItemExposesServerSidePriceAndQuantity() {
        when(clinicalItemRepository.findById(11L)).thenReturn(Optional.of(clinicalItem(ClinicalAttentionStatus.READY_TO_BILL, null)));

        BillableServiceItem billable = clinicalAdapter().getBillableItem(11L);

        assertEquals(new BigDecimal("45.00"), billable.getUnitPrice());
        assertEquals(1L, billable.getBranchId());
    }

    @Test
    void itemOfAttentionNotReadyToBillIsRejected() {
        when(clinicalItemRepository.findById(11L)).thenReturn(Optional.of(clinicalItem(ClinicalAttentionStatus.IN_PROGRESS, null)));

        assertThrows(BadRequestException.class, () -> clinicalAdapter().getBillableItem(11L));
    }

    @Test
    void alreadyBilledItemCannotBeBilledAgain() {
        ClinicalServiceItem billed = clinicalItem(ClinicalAttentionStatus.READY_TO_BILL, 99L);
        when(clinicalItemRepository.findById(11L)).thenReturn(Optional.of(billed));

        assertThrows(BadRequestException.class, () -> clinicalAdapter().getBillableItem(11L));
        // Otra venta intenta marcarlo: también se rechaza
        assertThrows(BadRequestException.class, () -> clinicalAdapter().markAsBilled(11L, 100L));
    }

    @Test
    void markAndUnmarkBilledLinksTheSaleDetail() {
        ClinicalServiceItem item = clinicalItem(ClinicalAttentionStatus.READY_TO_BILL, null);
        when(clinicalItemRepository.findById(11L)).thenReturn(Optional.of(item));

        clinicalAdapter().markAsBilled(11L, 77L);
        assertEquals(77L, item.getSaleDetailId());

        clinicalAdapter().markAsUnbilled(11L);
        assertNull(item.getSaleDetailId());
    }

    @Test
    void groomingMustBeReadyAndPriced() {
        Branch branch = new Branch();
        branch.setId(1L);
        Animal animal = new Animal();
        animal.setName("Rocky");
        Attentions attention = new Attentions();
        attention.setBranch(branch);
        attention.setAnimal(animal);
        GroomingSession session = GroomingSession.builder().id(5L).attention(attention)
                .status(GroomingStatus.BATHING).chargedPrice(new BigDecimal("30.00")).build();
        when(groomingRepository.findById(5L)).thenReturn(Optional.of(session));
        GroomingSessionBillableAdapter adapter = new GroomingSessionBillableAdapter(groomingRepository);

        assertThrows(BadRequestException.class, () -> adapter.getBillableItem(5L));

        session.setStatus(GroomingStatus.READY_FOR_PICKUP);
        assertEquals(new BigDecimal("30.00"), adapter.getBillableItem(5L).getUnitPrice());

        session.setChargedPrice(BigDecimal.ZERO);
        assertThrows(BadRequestException.class, () -> adapter.getBillableItem(5L));
    }

    @Test
    void pendingListUsesRepositoryFilters() {
        when(clinicalItemRepository.findBillable(1L, null, null, null))
                .thenReturn(List.of(clinicalItem(ClinicalAttentionStatus.READY_TO_BILL, null)));

        List<BillableServiceItem> pending = clinicalAdapter().listPending(1L, null, null, null);

        assertEquals(1, pending.size());
        assertEquals("Vacuna triple — Luna", pending.get(0).getDescription());
    }
}
