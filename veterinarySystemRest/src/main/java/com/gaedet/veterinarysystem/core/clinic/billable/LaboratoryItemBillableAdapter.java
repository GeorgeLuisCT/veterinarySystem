package com.gaedet.veterinarysystem.core.clinic.billable;

import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryRequest;
import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryRequestItem;
import com.gaedet.veterinarysystem.core.clinic.enums.LabRequestItemStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.LabRequestStatus;
import com.gaedet.veterinarysystem.core.clinic.repository.LaboratoryRequestItemRepository;
import com.gaedet.veterinarysystem.core.sales.billable.BillableServiceAdapter;
import com.gaedet.veterinarysystem.core.sales.billable.BillableServiceItem;
import com.gaedet.veterinarysystem.core.sales.enums.BillableServiceType;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.util.List;

/** Cobro de exámenes de laboratorio solicitados (un ítem = un examen). */
@Component
@RequiredArgsConstructor
public class LaboratoryItemBillableAdapter implements BillableServiceAdapter {

    private final LaboratoryRequestItemRepository itemRepository;
    private final ClinicalAttentionBillingCloser billingCloser;

    @Override
    public BillableServiceType supportsType() {
        return BillableServiceType.LABORATORY_ITEM;
    }

    @Override
    @Transactional(readOnly = true)
    public BillableServiceItem getBillableItem(Long itemId) {
        LaboratoryRequestItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Examen de laboratorio no encontrado"));
        if (item.getSaleDetailId() != null) {
            throw new BadRequestException("El examen #" + itemId + " ya fue cobrado en otra venta");
        }
        if (item.getStatus() == LabRequestItemStatus.CANCELED
                || item.getLaboratoryRequest().getStatus() == LabRequestStatus.CANCELED) {
            throw new BadRequestException("El examen #" + itemId + " fue cancelado y no puede cobrarse");
        }
        return toBillable(item);
    }

    @Override
    @Transactional
    public void markAsBilled(Long itemId, Long saleDetailId) {
        LaboratoryRequestItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Examen de laboratorio no encontrado"));
        if (item.getSaleDetailId() != null && !item.getSaleDetailId().equals(saleDetailId)) {
            throw new BadRequestException("El examen #" + itemId + " ya fue cobrado en otra venta");
        }
        item.setSaleDetailId(saleDetailId);
        billingCloser.onBillingChanged(item.getLaboratoryRequest().getClinicalAttention());
    }

    @Override
    @Transactional
    public void markAsUnbilled(Long itemId) {
        itemRepository.findById(itemId).ifPresent(item -> {
            item.setSaleDetailId(null);
            billingCloser.onBillingChanged(item.getLaboratoryRequest().getClinicalAttention());
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillableServiceItem> listPending(Long branchId, Long attentionId, Long patientId, String query) {
        return itemRepository.findBillable(branchId, attentionId, patientId, query).stream()
                .map(this::toBillable)
                .toList();
    }

    private BillableServiceItem toBillable(LaboratoryRequestItem item) {
        LaboratoryRequest request = item.getLaboratoryRequest();
        return BillableServiceItem.builder()
                .type(supportsType())
                .itemId(item.getId())
                .branchId(request.getLaboratory() != null && request.getLaboratory().getBranch() != null
                        ? request.getLaboratory().getBranch().getId() : null)
                .description("Laboratorio: " + item.getTest().getName() + " — " + request.getAnimal().getName())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .taxRate(null)
                .metadataJson(null)
                .build();
    }
}
