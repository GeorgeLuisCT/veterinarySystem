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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.persistence.EntityNotFoundException;

@Component
@RequiredArgsConstructor
public class ClinicalServiceItemBillableAdapter implements BillableServiceAdapter {

    private final ClinicalServiceItemRepository clinicalServiceItemRepository;
    private final ObjectMapper objectMapper;

    @Override
    public BillableServiceType supportsType() {
        return BillableServiceType.CLINICAL_SERVICE_ITEM;
    }

    @Override
    public BillableServiceItem getBillableItem(Long itemId) {
        ClinicalServiceItem item = clinicalServiceItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Ítem clínico no encontrado"));

        ClinicalAttention clinicalAttention = item.getClinicalAttention();
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
    public void markAsBilled(Long itemId, Long saleDetailId) {
        // Aún no se registra un vínculo persistente con la venta.
        // Se deja como no-op para futuras iteraciones.
    }

    @Override
    public void markAsUnbilled(Long itemId) {
        // No-op por ahora.
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
