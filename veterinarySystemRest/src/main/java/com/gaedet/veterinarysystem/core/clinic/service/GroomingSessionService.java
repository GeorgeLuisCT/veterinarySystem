package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.clinic.dto.*;
import com.gaedet.veterinarysystem.core.clinic.entity.Attentions;
import com.gaedet.veterinarysystem.core.clinic.entity.GroomingMaterialUsed;
import com.gaedet.veterinarysystem.core.clinic.entity.GroomingSession;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionType;
import com.gaedet.veterinarysystem.core.clinic.enums.GroomingStatus;
import com.gaedet.veterinarysystem.core.clinic.mapper.GroomingSessionMapper;
import com.gaedet.veterinarysystem.core.clinic.repository.AttentionRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.GroomingMaterialUsedRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.GroomingSessionRepository;
import com.gaedet.veterinarysystem.core.clinic.specs.GroomingSessionSpecs;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.repository.EmployeeRepository;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;
import com.gaedet.veterinarysystem.core.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.openapitools.jackson.nullable.JsonNullable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.OptimisticLockException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroomingSessionService {

    private final GroomingSessionRepository groomingSessionRepository;
    private final GroomingMaterialUsedRepository groomingMaterialUsedRepository;
    private final com.gaedet.veterinarysystem.core.inventory.service.InventoryConsumptionService inventoryConsumptionService;
    private final AttentionRepository attentionRepository;
    private final EmployeeRepository employeeRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public GroomingSessionDetailResponse getDetail(Long id) {
        GroomingSession session = groomingSessionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("GroomingSession no encontrada: id=" + id));
        return GroomingSessionMapper.toDetail(session);
    }

    @Transactional
    public GroomingSessionDetailResponse getOrCreateByAttentionId(Long attentionId) {

        Attentions attention = attentionRepository.findById(attentionId)
                .orElseThrow(() -> new IllegalArgumentException("Atención no encontrada: id=" + attentionId));

        if (attention.getType() != AttentionType.GROOMING) {
            throw new IllegalStateException(
                    "Solo se puede crear una sesión de grooming para atenciones de tipo GROOMING. "
                            + "Atención " + attentionId + " es de tipo " + attention.getType()
            );
        }

        attentionRepository.promoteWaitingToInProgress(attentionId);

        return groomingSessionRepository.findWithDetailsByAttention_Id(attentionId)
                .map(GroomingSessionMapper::toDetail)
                .orElseGet(() -> {
                    GroomingSession entity = GroomingSession.builder()
                            .attention(attention)
                            .status(GroomingStatus.DRAFT)
                            .build();

                    try {
                        GroomingSession saved = groomingSessionRepository.saveAndFlush(entity);
                        return getDetail(saved.getId());
                    } catch (DataIntegrityViolationException ex) {
                        GroomingSession existing = groomingSessionRepository.findByAttention_Id(attentionId)
                                .orElseThrow(() -> ex);
                        return getDetail(existing.getId());
                    }
                });
    }

    @Transactional
    public GroomingSessionCreatedResponse create(CreateGroomingSessionRequest request) {
        Attentions attention = attentionRepository.findWithDetailsById(request.getAttentionId())
                .orElseThrow(() -> new IllegalArgumentException("Atención no encontrada: id=" + request.getAttentionId()));

        if (groomingSessionRepository.existsByAttention_Id(attention.getId())) {
            throw new IllegalStateException("Ya existe una sesión de grooming para la atención indicada.");
        }

        Employee professional = request.getAssignedProfessionalId() != null
                ? employeeRepository.findById(request.getAssignedProfessionalId())
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: id=" + request.getAssignedProfessionalId()))
                : null;

        GroomingStatus status = request.getStatus() != null ? request.getStatus() : GroomingStatus.DRAFT;

        GroomingSession entity = GroomingSession.builder()
                .attention(attention)
                .startedAt(request.getStartedAt())
                .finishedAt(request.getFinishedAt())
                .assignedProfessional(professional)
                .chargedPrice(request.getChargedPrice())
                .status(status)
                .behaviorNotes(normalize(request.getBehaviorNotes()))
                .clinicalObservations(normalize(request.getClinicalObservations()))
                .build();

        GroomingSession saved = groomingSessionRepository.save(entity);

        return new GroomingSessionCreatedResponse(
                saved.getId(),
                attention.getId(),
                saved.getStartedAt(),
                saved.getFinishedAt(),
                professional != null ? professional.getId() : null,
                saved.getStatus()
        );
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<GroomingSessionSummaryResponse> list(
            List<GroomingStatus> statuses,
            Long branchId,
            Long animalId,
            Long attentionId,
            Long assignedProfessionalId,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("startedAt").descending());

        Page<GroomingSession> result = groomingSessionRepository.findAll(
                GroomingSessionSpecs.byFilters(
                        statuses,
                        branchId,
                        animalId,
                        attentionId,
                        assignedProfessionalId,
                        startDate,
                        endDate
                ),
                pageable
        );

        List<GroomingSessionSummaryResponse> content = result.getContent().stream()
                .map(GroomingSessionMapper::toSummary)
                .collect(Collectors.toList());

        return PaginatedResponse.<GroomingSessionSummaryResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional
    public GroomingSessionPatchResponse update(Long id, UpdateGroomingSessionRequest request) {
        GroomingSession session = groomingSessionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("GroomingSession no encontrada: id=" + id));

        if (!Objects.equals(session.getVersion(), request.getVersion())) {
            throw new OptimisticLockException("Versión desactualizada");
        }

        Map<String, Object> updated = new LinkedHashMap<>();

        apply(updated, "startedAt", request.getStartedAt(), session::setStartedAt, session::getStartedAt);
        apply(updated, "finishedAt", request.getFinishedAt(), session::setFinishedAt, session::getFinishedAt);
        applyEmployee(updated, "assignedProfessionalId", request.getAssignedProfessionalId(), false, session::setAssignedProfessional, session::getAssignedProfessional);
        apply(updated, "status", request.getStatus(), session::setStatus, session::getStatus);
        apply(updated, "chargedPrice", request.getChargedPrice(), session::setChargedPrice, session::getChargedPrice);
        applyStr(updated, "behaviorNotes", request.getBehaviorNotes(), session::setBehaviorNotes, session::getBehaviorNotes);
        applyStr(updated, "clinicalObservations", request.getClinicalObservations(), session::setClinicalObservations, session::getClinicalObservations);

        GroomingSession flushed = groomingSessionRepository.saveAndFlush(session);
        GroomingSessionSummaryResponse summary = GroomingSessionMapper.toSummary(flushed);

        return GroomingSessionPatchResponse.builder()
                .id(flushed.getId())
                .version(flushed.getVersion())
                .status(flushed.getStatus())
                .updated(updated)
                .summary(summary)
                .build();
    }

    @Transactional
    public GroomingSessionDetailResponse addMaterial(Long id, AddGroomingMaterialRequest request) {
        GroomingSession session = groomingSessionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("GroomingSession no encontrada: id=" + id));

        Product product = null;
        if (request.getProductId() != null) {
            product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: id=" + request.getProductId()));
        }

        BigDecimal subtotal = request.getUnitPrice() != null && request.getQuantity() != null
                ? request.getUnitPrice().multiply(request.getQuantity())
                : null;

        GroomingMaterialUsed material = GroomingMaterialUsed.builder()
                .groomingSession(session)
                .product(product)
                .unregisteredProductName(normalize(request.getUnregisteredProductName()))
                .quantity(request.getQuantity())
                .unitType(request.getUnitType())
                .unitPrice(request.getUnitPrice())
                .subtotal(subtotal)
                .build();

        GroomingMaterialUsed saved = groomingMaterialUsedRepository.save(material);
        session.getMaterialsUsed().add(saved);

        // Un material del inventario descuenta stock (FEFO) de la sucursal donde se atiende
        if (product != null) {
            if (request.getQuantity() == null || request.getQuantity().signum() <= 0) {
                throw new com.gaedet.veterinarysystem.exeption.BadRequestException("La cantidad del material debe ser mayor a cero");
            }
            Long branchId = session.getAttention() != null && session.getAttention().getBranch() != null
                    ? session.getAttention().getBranch().getId() : null;
            inventoryConsumptionService.consume(product.getId(), branchId, request.getQuantity(),
                    request.getUnitType(), "GroomingMaterialUsed", saved.getId());
        }

        return GroomingSessionMapper.toDetail(session);
    }

    private void applyEmployee(
            Map<String, Object> updated,
            String field,
            JsonNullable<Long> value,
            boolean required,
            Consumer<Employee> setter,
            Supplier<Employee> current
    ) {
        if (value == null || !value.isPresent()) {
            return;
        }

        Long employeeId = value.orElse(null);
        if (employeeId == null) {
            if (required) {
                throw new IllegalArgumentException("El " + field + " no puede ser nulo.");
            }
            setter.accept(null);
            updated.put(field, null);
            return;
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: id=" + employeeId));
        setter.accept(employee);
        Employee persisted = current.get();
        updated.put(field, persisted != null ? persisted.getId() : null);
    }

    private <T> void apply(
            Map<String, Object> updated,
            String field,
            JsonNullable<T> value,
            Consumer<T> setter,
            Supplier<T> current
    ) {
        if (value != null && value.isPresent()) {
            setter.accept(value.orElse(null));
            updated.put(field, current.get());
        }
    }

    private void applyStr(
            Map<String, Object> updated,
            String field,
            JsonNullable<String> value,
            Consumer<String> setter,
            Supplier<String> current
    ) {
        if (value != null && value.isPresent()) {
            setter.accept(normalize(value.orElse(null)));
            updated.put(field, current.get());
        }
    }

    private String normalize(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
