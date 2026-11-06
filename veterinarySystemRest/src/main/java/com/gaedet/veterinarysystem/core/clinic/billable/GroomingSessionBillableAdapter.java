package com.gaedet.veterinarysystem.core.clinic.billable;

import com.gaedet.veterinarysystem.core.clinic.entity.GroomingSession;
import com.gaedet.veterinarysystem.core.clinic.enums.GroomingStatus;
import com.gaedet.veterinarysystem.core.clinic.repository.GroomingSessionRepository;
import com.gaedet.veterinarysystem.core.sales.billable.BillableServiceAdapter;
import com.gaedet.veterinarysystem.core.sales.billable.BillableServiceItem;
import com.gaedet.veterinarysystem.core.sales.enums.BillableServiceType;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.List;

/** Cobro de sesiones de peluquería terminadas (listas para entregar) con precio definido. */
@Component
@RequiredArgsConstructor
public class GroomingSessionBillableAdapter implements BillableServiceAdapter {

    private final GroomingSessionRepository groomingSessionRepository;

    @Override
    public BillableServiceType supportsType() {
        return BillableServiceType.GROOMING_SESSION;
    }

    @Override
    @Transactional(readOnly = true)
    public BillableServiceItem getBillableItem(Long itemId) {
        GroomingSession session = groomingSessionRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Sesión de peluquería no encontrada"));
        if (session.getSaleDetailId() != null) {
            throw new BadRequestException("La sesión de peluquería #" + itemId + " ya fue cobrada en otra venta");
        }
        if (session.getStatus() != GroomingStatus.READY_FOR_PICKUP) {
            throw new BadRequestException("La sesión de peluquería aún no está lista para cobrar");
        }
        if (session.getChargedPrice() == null || session.getChargedPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("La sesión de peluquería no tiene un precio definido");
        }
        return toBillable(session);
    }

    @Override
    @Transactional
    public void markAsBilled(Long itemId, Long saleDetailId) {
        GroomingSession session = groomingSessionRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Sesión de peluquería no encontrada"));
        if (session.getSaleDetailId() != null && !session.getSaleDetailId().equals(saleDetailId)) {
            throw new BadRequestException("La sesión de peluquería #" + itemId + " ya fue cobrada en otra venta");
        }
        session.setSaleDetailId(saleDetailId);
    }

    @Override
    @Transactional
    public void markAsUnbilled(Long itemId) {
        groomingSessionRepository.findById(itemId).ifPresent(session -> session.setSaleDetailId(null));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillableServiceItem> listPending(Long branchId, Long attentionId, Long patientId, String query) {
        return groomingSessionRepository.findBillable(branchId, attentionId, patientId, query).stream()
                .map(this::toBillable)
                .toList();
    }

    private BillableServiceItem toBillable(GroomingSession session) {
        return BillableServiceItem.builder()
                .type(supportsType())
                .itemId(session.getId())
                .branchId(session.getAttention().getBranch() != null ? session.getAttention().getBranch().getId() : null)
                .description("Peluquería — " + session.getAttention().getAnimal().getName())
                .unitPrice(session.getChargedPrice())
                .quantity(BigDecimal.ONE)
                .taxRate(null)
                .metadataJson(null)
                .build();
    }
}
