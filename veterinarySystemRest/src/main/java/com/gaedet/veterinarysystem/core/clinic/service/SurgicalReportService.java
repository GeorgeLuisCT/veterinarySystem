package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.branches.entity.OperatingRoom;
import com.gaedet.veterinarysystem.core.branches.repository.OperatingRoomRepository;
import com.gaedet.veterinarysystem.core.clinic.dto.AddSurgicalReportAnestheticDrugRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.AddSurgicalReportMaterialRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.AddSurgicalReportPostOperativeIndicationRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.CreateSurgicalReportRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalReportCreatedResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalReportDetailResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalReportPatchResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalReportSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.UpdateSurgicalReportRequest;
import com.gaedet.veterinarysystem.core.clinic.entity.AnestheticDrug;
import com.gaedet.veterinarysystem.core.clinic.entity.Attentions;
import com.gaedet.veterinarysystem.core.clinic.entity.PostOperativeIndication;
import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalMaterial;
import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalReport;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionType;
import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalReportStatus;
import com.gaedet.veterinarysystem.core.clinic.mapper.SurgicalReportMapper;
import com.gaedet.veterinarysystem.core.clinic.repository.AnestheticDrugRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.AttentionRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.PostOperativeIndicationRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.SurgicalMaterialRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.SurgicalReportRepository;
import com.gaedet.veterinarysystem.core.clinic.specs.SurgicalReportSpecs;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.repository.EmployeeRepository;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;
import com.gaedet.veterinarysystem.core.inventory.repository.ProductRepository;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
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
public class SurgicalReportService {

    private final SurgicalReportRepository surgicalReportRepository;
    private final AttentionRepository attentionRepository;
    private final EmployeeRepository employeeRepository;
    private final OperatingRoomRepository operatingRoomRepository;
    private final ProductRepository productRepository;
    private final AnestheticDrugRepository anestheticDrugRepository;
    private final SurgicalMaterialRepository surgicalMaterialRepository;
    private final com.gaedet.veterinarysystem.core.inventory.service.InventoryConsumptionService inventoryConsumptionService;
    private final PostOperativeIndicationRepository postOperativeIndicationRepository;

    @Transactional(readOnly = true)
    public SurgicalReportDetailResponse getDetail(Long id) {
        SurgicalReport report = surgicalReportRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Informe quirúrgico no encontrado: id=" + id));
        return SurgicalReportMapper.toDetail(report);
    }

    @Transactional
    public SurgicalReportDetailResponse getOrCreateByAttentionId(Long attentionId) {

        Attentions attention = attentionRepository.findById(attentionId)
                .orElseThrow(() -> new IllegalArgumentException("Atención no encontrada: id=" + attentionId));

        if (attention.getType() != AttentionType.SURGERY) {
            throw new IllegalStateException(
                    "Solo se puede crear un reporte quirúrgico para atenciones de tipo SURGERY. "
                            + "Atención " + attentionId + " es de tipo " + attention.getType()
            );
        }

        attentionRepository.promoteWaitingToInProgress(attentionId);

        return surgicalReportRepository.findWithDetailsByAttention_Id(attentionId)
                .map(SurgicalReportMapper::toDetail)
                .orElseGet(() -> {
                    SurgicalReport report = SurgicalReport.builder()
                            .attention(attention)
                            .status(SurgicalReportStatus.DRAFT)
                            .build();

                    try {
                        SurgicalReport saved = surgicalReportRepository.saveAndFlush(report);
                        return getDetail(saved.getId());
                    } catch (DataIntegrityViolationException ex) {
                        SurgicalReport existing = surgicalReportRepository.findByAttention_Id(attentionId)
                                .orElseThrow(() -> ex);
                        return getDetail(existing.getId());
                    }
                });
    }

    @Transactional
    public SurgicalReportCreatedResponse create(CreateSurgicalReportRequest request) {
        Attentions attention = attentionRepository.findWithDetailsById(request.getAttentionId())
                .orElseThrow(() -> new IllegalArgumentException("Atención no encontrada: id=" + request.getAttentionId()));

        if (surgicalReportRepository.existsByAttention_Id(attention.getId())) {
            throw new IllegalStateException("Ya existe un informe quirúrgico para la atención indicada.");
        }

        Employee surgeon = getEmployeeOrThrow(request.getSurgeonId());
        Employee anesthesiologist = request.getAnesthesiologistId() != null
                ? getEmployeeOrThrow(request.getAnesthesiologistId())
                : null;
        Employee assistant = request.getAssistantId() != null
                ? getEmployeeOrThrow(request.getAssistantId())
                : null;

        OperatingRoom operatingRoom = operatingRoomRepository.findById(request.getOperatingRoomId())
                .orElseThrow(() -> new IllegalArgumentException("Sala de operaciones no encontrada: id=" + request.getOperatingRoomId()));

        validateOperatingRoomBranch(attention, operatingRoom);

        SurgicalReportStatus status = request.getStatus() != null ? request.getStatus() : SurgicalReportStatus.DRAFT;

        SurgicalReport report = SurgicalReport.builder()
                .attention(attention)
                .surgeryStartAt(request.getSurgeryStartAt())
                .surgeryEndAt(request.getSurgeryEndAt())
                .surgeon(surgeon)
                .anesthesiologist(anesthesiologist)
                .assistant(assistant)
                .operatingRoom(operatingRoom)
                .status(status)
                .monitoring(normalize(request.getMonitoring()))
                .findings(normalize(request.getFindings()))
                .surgicalTechniqueDescription(normalize(request.getSurgicalTechniqueDescription()))
                .build();

        SurgicalReport saved = surgicalReportRepository.save(report);

        return new SurgicalReportCreatedResponse(
                saved.getId(),
                attention.getId(),
                saved.getSurgeryStartAt(),
                saved.getSurgeryEndAt(),
                surgeon.getId(),
                saved.getStatus()
        );
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<SurgicalReportSummaryResponse> list(
            List<SurgicalReportStatus> statuses,
            Long branchId,
            Long animalId,
            Long attentionId,
            Long surgeonId,
            Long operatingRoomId,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("surgeryStartAt").descending());

        Page<SurgicalReport> result = surgicalReportRepository.findAll(
                SurgicalReportSpecs.byFilters(
                        statuses,
                        branchId,
                        animalId,
                        attentionId,
                        surgeonId,
                        operatingRoomId,
                        startDate,
                        endDate
                ),
                pageable
        );

        List<SurgicalReportSummaryResponse> content = result.getContent().stream()
                .map(SurgicalReportMapper::toSummary)
                .collect(Collectors.toList());

        return PaginatedResponse.<SurgicalReportSummaryResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional
    public SurgicalReportPatchResponse update(Long id, UpdateSurgicalReportRequest request) {
        SurgicalReport report = surgicalReportRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Informe quirúrgico no encontrado: id=" + id));

        if (!Objects.equals(report.getVersion(), request.getVersion())) {
            throw new OptimisticLockException("Versión desactualizada");
        }

        Map<String, Object> updated = new LinkedHashMap<>();

        apply(updated, "surgeryStartAt", request.getSurgeryStartAt(), report::setSurgeryStartAt, report::getSurgeryStartAt);
        apply(updated, "surgeryEndAt", request.getSurgeryEndAt(), report::setSurgeryEndAt, report::getSurgeryEndAt);
        applyEmployee(updated, "surgeonId", request.getSurgeonId(), true, report::setSurgeon, report::getSurgeon);
        applyEmployee(updated, "anesthesiologistId", request.getAnesthesiologistId(), false, report::setAnesthesiologist, report::getAnesthesiologist);
        applyEmployee(updated, "assistantId", request.getAssistantId(), false, report::setAssistant, report::getAssistant);
        applyOperatingRoom(updated, report, request.getOperatingRoomId());
        apply(updated, "status", request.getStatus(), report::setStatus, report::getStatus);
        applyStr(updated, "monitoring", request.getMonitoring(), report::setMonitoring, report::getMonitoring);
        applyStr(updated, "findings", request.getFindings(), report::setFindings, report::getFindings);
        applyStr(updated, "surgicalTechniqueDescription", request.getSurgicalTechniqueDescription(), report::setSurgicalTechniqueDescription, report::getSurgicalTechniqueDescription);

        SurgicalReport flushed = surgicalReportRepository.saveAndFlush(report);
        SurgicalReportSummaryResponse summary = SurgicalReportMapper.toSummary(flushed);

        return SurgicalReportPatchResponse.builder()
                .id(flushed.getId())
                .version(flushed.getVersion())
                .status(flushed.getStatus())
                .updated(updated)
                .summary(summary)
                .build();
    }

    @Transactional
    public SurgicalReportDetailResponse addAnestheticDrug(Long id, AddSurgicalReportAnestheticDrugRequest request) {
        SurgicalReport report = surgicalReportRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Informe quirúrgico no encontrado: id=" + id));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: id=" + request.getProductId()));

        AnestheticDrug drug = AnestheticDrug.builder()
                .surgicalReport(report)
                .product(product)
                .phase(request.getPhase())
                .doseAmount(request.getDoseAmount())
                .doseUnit(request.getDoseUnit())
                .route(request.getRoute())
                .build();

        AnestheticDrug saved = anestheticDrugRepository.save(drug);
        report.getAnestheticProtocol().add(saved);

        Long drugBranchId = report.getAttention() != null && report.getAttention().getBranch() != null
                ? report.getAttention().getBranch().getId() : null;
        inventoryConsumptionService.consume(product.getId(), drugBranchId, request.getDoseAmount(),
                request.getDoseUnit(), "AnestheticDrug", saved.getId());

        return SurgicalReportMapper.toDetail(report);
    }

    @Transactional
    public SurgicalReportDetailResponse addMaterial(Long id, AddSurgicalReportMaterialRequest request) {
        SurgicalReport report = surgicalReportRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Informe quirúrgico no encontrado: id=" + id));

        Product product = null;
        if (request.getProductId() != null) {
            product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: id=" + request.getProductId()));
        }

        String customName = normalize(request.getUnregisteredProductName());

        SurgicalMaterial material = SurgicalMaterial.builder()
                .surgicalReport(report)
                .product(product)
                .unregisteredProductName(customName)
                .quantity(request.getQuantity())
                .unitType(request.getUnitType())
                .build();

        SurgicalMaterial saved = surgicalMaterialRepository.save(material);
        report.getMaterialsUsed().add(saved);

        if (product != null) {
            Long materialBranchId = report.getAttention() != null && report.getAttention().getBranch() != null
                    ? report.getAttention().getBranch().getId() : null;
            inventoryConsumptionService.consume(product.getId(), materialBranchId,
                    java.math.BigDecimal.valueOf(request.getQuantity() != null ? request.getQuantity() : 0),
                    request.getUnitType(), "SurgicalMaterial", saved.getId());
        }

        return SurgicalReportMapper.toDetail(report);
    }

    @Transactional
    public SurgicalReportDetailResponse addPostOperativeIndication(Long id, AddSurgicalReportPostOperativeIndicationRequest request) {
        SurgicalReport report = surgicalReportRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Informe quirúrgico no encontrado: id=" + id));

        Product product = null;
        if (request.getProductId() != null) {
            product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: id=" + request.getProductId()));
        }

        PostOperativeIndication indication = PostOperativeIndication.builder()
                .surgicalReport(report)
                .product(product)
                .doseAmount(request.getDoseAmount())
                .doseUnit(request.getDoseUnit())
                .frequencyValue(request.getFrequencyValue())
                .frequencyUnit(request.getFrequencyUnit())
                .route(request.getRoute())
                .nonDrugInstruction(normalize(request.getNonDrugInstruction()))
                .build();

        PostOperativeIndication saved = postOperativeIndicationRepository.save(indication);
        report.getPostOperativeIndications().add(saved);

        return SurgicalReportMapper.toDetail(report);
    }

    private void applyOperatingRoom(
            Map<String, Object> updated,
            SurgicalReport report,
            JsonNullable<Long> operatingRoomId
    ) {
        if (operatingRoomId == null || !operatingRoomId.isPresent()) {
            return;
        }

        Long roomId = operatingRoomId.orElse(null);
        if (roomId == null) {
            report.setOperatingRoom(null);
            updated.put("operatingRoomId", null);
            return;
        }

        OperatingRoom room = operatingRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Sala de operaciones no encontrada: id=" + roomId));

        Attentions attention = report.getAttention();
        validateOperatingRoomBranch(attention, room);

        report.setOperatingRoom(room);
        updated.put("operatingRoomId", room.getId());
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

        Employee employee = getEmployeeOrThrow(employeeId);
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

    private Employee getEmployeeOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: id=" + id));
    }

    private void validateOperatingRoomBranch(Attentions attention, OperatingRoom room) {
        if (attention == null) {
            return;
        }
        Branch attentionBranch = attention.getBranch();
        Branch roomBranch = room != null ? room.getBranch() : null;
        if (attentionBranch != null && roomBranch != null
                && !Objects.equals(attentionBranch.getId(), roomBranch.getId())) {
            throw new IllegalArgumentException("La sala de operaciones pertenece a una sucursal diferente a la atención.");
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
