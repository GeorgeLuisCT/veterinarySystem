package com.gaedet.veterinarysystem.core.clinic.billable;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.gaedet.veterinarysystem.core.clinic.entity.Attentions;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalAttention;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalServiceItem;
import com.gaedet.veterinarysystem.core.clinic.repository.ClinicalServiceItemRepository;
import com.gaedet.veterinarysystem.core.sales.billable.BillableServiceAdapter;
import com.gaedet.veterinarysystem.core.sales.billable.BillableServiceItem;
import com.gaedet.veterinarysystem.core.sales.enums.BillableServiceType;
import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalAttentionStatus;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.persistence.EntityNotFoundException;

@Component
@RequiredArgsConstructor
public class ClinicalServiceItemBillableAdapter implements BillableServiceAdapter {

    private final ClinicalServiceItemRepository clinicalServiceItemRepository;
    private final ObjectMapper objectMapper;
    private final ClinicalAttentionBillingCloser billingCloser;

    @Override
    public BillableServiceType supportsType() {
        return BillableServiceType.CLINICAL_SERVICE_ITEM;
    }

    @Override
    public BillableServiceItem getBillableItem(Long itemId) {
        ClinicalServiceItem item = clinicalServiceItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Ítem clínico no encontrado"));

        if (item.getSaleDetailId() != null) {
            throw new BadRequestException("El servicio clínico #" + item.getId() + " ya fue cobrado en otra venta");
        }

        ClinicalAttention clinicalAttention = item.getClinicalAttention();
        if (clinicalAttention != null && clinicalAttention.getStatus() != ClinicalAttentionStatus.READY_TO_BILL) {
            throw new BadRequestException("La atención clínica aún no está lista para facturar");
        }
        Attentions attention = clinicalAttention != null ? clinicalAttention.getAttention() : null;

        Long branchId = attention != null && attention.getBranch() != null
                ? attention.getBranch().getId()
                : null;

        String description = item.getClinicalService() != null
                ? item.getClinicalService().getName()
                : null;

        if (description == null || description.isBlank()) {
            description = "Servicio clínico #" + item.getId();
        }

        return BillableServiceItem.builder()
                .type(supportsType())
                .itemId(item.getId())
                .branchId(branchId)
                .description(description)
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .taxRate(null)
                .metadataJson(buildMetadataJson(clinicalAttention, attention, item))
                .build();
    }

    @Override
    @Transactional
    public void markAsBilled(Long itemId, Long saleDetailId) {
        ClinicalServiceItem item = clinicalServiceItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Ítem clínico no encontrado"));
        // Evita el doble cobro: un ítem solo puede pertenecer a un detalle de venta
        if (item.getSaleDetailId() != null && !item.getSaleDetailId().equals(saleDetailId)) {
            throw new BadRequestException("El servicio clínico #" + itemId + " ya fue cobrado en otra venta");
        }
        item.setSaleDetailId(saleDetailId);
        billingCloser.onBillingChanged(item.getClinicalAttention());
    }

    @Override
    @Transactional
    public void markAsUnbilled(Long itemId) {
        clinicalServiceItemRepository.findById(itemId).ifPresent(item -> {
            item.setSaleDetailId(null);
            billingCloser.onBillingChanged(item.getClinicalAttention());
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillableServiceItem> listPending(Long branchId, Long attentionId, Long patientId, String query) {
        return clinicalServiceItemRepository.findBillable(branchId, attentionId, patientId, query).stream()
                .map(item -> {
                    ClinicalAttention clinicalAttention = item.getClinicalAttention();
                    Attentions attention = clinicalAttention.getAttention();
                    String animalName = attention.getAnimal().getName();
                    return BillableServiceItem.builder()
                            .type(supportsType())
                            .itemId(item.getId())
                            .branchId(attention.getBranch() != null ? attention.getBranch().getId() : null)
                            .description(item.getClinicalService().getName() + " — " + animalName)
                            .unitPrice(item.getUnitPrice())
                            .quantity(item.getQuantity())
                            .taxRate(null)
                            .metadataJson(buildMetadataJson(clinicalAttention, attention, item))
                            .build();
                })
                .toList();
    }

    private String buildMetadataJson(ClinicalAttention clinicalAttention, Attentions attention, ClinicalServiceItem item) {
        try {
            ObjectNode node = objectMapper.createObjectNode();
            if (clinicalAttention != null) {
                node.put("clinicalAttentionId", clinicalAttention.getId());
            }
            if (attention != null) {
                node.put("attentionId", attention.getId());
                if (attention.getAnimal() != null) {
                    node.put("animalId", attention.getAnimal().getId());
                    node.put("animalName", attention.getAnimal().getName());
                }
            }
            if (item.getClinicalService() != null) {
                node.put("clinicalServiceId", item.getClinicalService().getId());
                node.put("clinicalServiceName", item.getClinicalService().getName());
                if (item.getClinicalService().getClinicalServiceCategory() != null) {
                    node.put("clinicalServiceCategory", item.getClinicalService().getClinicalServiceCategory().name());
                }
            }

            return node.size() > 0 ? objectMapper.writeValueAsString(node) : null;
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
