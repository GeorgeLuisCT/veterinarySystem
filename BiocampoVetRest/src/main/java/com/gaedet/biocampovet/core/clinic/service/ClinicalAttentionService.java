package com.gaedet.biocampovet.core.clinic.service;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.branches.entity.Laboratory;
import com.gaedet.biocampovet.core.branches.entity.OperatingRoom;
import com.gaedet.biocampovet.core.branches.repository.BranchRepository;
import com.gaedet.biocampovet.core.branches.repository.LaboratoryRepository;
import com.gaedet.biocampovet.core.branches.repository.OperatingRoomRepository;
import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.entity.Attentions;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalAttention;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalService;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalServiceItem;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalServiceProduct;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryRequest;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryRequestItem;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryTest;
import com.gaedet.biocampovet.core.clinic.entity.MedicationAdministration;
import com.gaedet.biocampovet.core.clinic.entity.SurgicalOrder;
import com.gaedet.biocampovet.core.clinic.enums.*;
import com.gaedet.biocampovet.core.clinic.mapper.ClinicalAttentionMapper;
import com.gaedet.biocampovet.core.clinic.repository.AttentionRepository;
import com.gaedet.biocampovet.core.clinic.repository.ClinicalAttentionRepository;
import com.gaedet.biocampovet.core.clinic.repository.ClinicalServiceItemRepository;
import com.gaedet.biocampovet.core.clinic.repository.ClinicalServiceRepository;
import com.gaedet.biocampovet.core.clinic.repository.LaboratoryRequestRepository;
import com.gaedet.biocampovet.core.clinic.repository.LaboratoryTestRepository;
import com.gaedet.biocampovet.core.clinic.repository.MedicationAdministrationRepository;
import com.gaedet.biocampovet.core.clinic.repository.SurgicalOrderRepository;
import com.gaedet.biocampovet.core.clinic.specs.ClinicalAttentionSpecs;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.employees.repository.EmployeeRepository;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.repository.ProductRepository;
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
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClinicalAttentionService {

    private final ClinicalAttentionRepository clinicalAttentionRepository;
    private final AttentionRepository attentionRepository;
    private final MedicationAdministrationRepository medicationAdministrationRepository;
    private final ClinicalServiceItemRepository clinicalServiceItemRepository;
    private final LaboratoryRequestRepository laboratoryRequestRepository;
    private final LaboratoryTestRepository laboratoryTestRepository;
    private final SurgicalOrderRepository surgicalOrderRepository;
    private final ProductRepository productRepository;
    private final EmployeeRepository employeeRepository;
    private final ClinicalServiceRepository clinicalServiceRepository;
    private final BranchRepository branchRepository;
    private final LaboratoryRepository laboratoryRepository;
    private final OperatingRoomRepository operatingRoomRepository;

    @Transactional
    public ClinicalAttentionCreatedResponse create(CreateClinicalAttentionRequest request) {
        Attentions attention = attentionRepository.findWithDetailsById(request.getAttentionId())
                .orElseThrow(() -> new IllegalArgumentException("Atención no encontrada: id=" + request.getAttentionId()));

        if (clinicalAttentionRepository.existsByAttention_Id(attention.getId())) {
            throw new IllegalStateException("La atención clínica ya está registrada para la atención indicada.");
        }

        ClinicalAttentionStatus status = request.getStatus() != null
                ? request.getStatus()
                : ClinicalAttentionStatus.OPEN;

        ClinicalAttention entity = ClinicalAttention.builder()
                .attention(attention)
                .visitDate(request.getVisitDate() != null ? request.getVisitDate() : LocalDateTime.now())
                .status(status)
                .build();

        ClinicalAttention saved = clinicalAttentionRepository.save(entity);

        return new ClinicalAttentionCreatedResponse(
                attention.getAnimal().getId(),
                attention.getId(),
                saved.getId(),
                saved.getStatus()
        );
    }

    @Transactional(readOnly = true)
    public ClinicalAttentionDetailResponse getDetail(Long id) {
        ClinicalAttention clinicalAttention = clinicalAttentionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("ClinicalAttention no encontrada: id=" + id));
        return ClinicalAttentionMapper.toDetail(clinicalAttention);
    }

    @Transactional
    public ClinicalAttentionDetailResponse getOrCreateByAttentionId(Long attentionId) {

        Attentions attention = attentionRepository.findById(attentionId)
                .orElseThrow(() -> new IllegalArgumentException("Atención no encontrada: id=" + attentionId));

        if (attention.getType() != AttentionType.CLINIC) {
            throw new IllegalStateException(
                    "Solo se puede crear una atención clínica para atenciones de tipo CLINIC. "
                            + "Atención " + attentionId + " es de tipo " + attention.getType()
            );
        }

        attentionRepository.promoteWaitingToInConsultation(attentionId);

        return clinicalAttentionRepository.findWithDetailsByAttentionId(attentionId)
                .map(ClinicalAttentionMapper::toDetail)
                .orElseGet(() -> {
                    ClinicalAttention ca = ClinicalAttention.builder()
                            .attention(attention)
                            .visitDate(LocalDateTime.now())
                            .status(ClinicalAttentionStatus.OPEN)
                            .build();

                    try {
                        ClinicalAttention saved = clinicalAttentionRepository.saveAndFlush(ca);
                        return getDetail(saved.getId());
                    } catch (DataIntegrityViolationException ex) {
                        ClinicalAttention existing = clinicalAttentionRepository
                                .findByAttentionId(attentionId)
                                .orElseThrow(() -> ex);
                        return getDetail(existing.getId());
                    }
                });
    }

    @Transactional
    public ClinicalAttentionPatchResponse update(Long id, UpdateClinicalAttentionRequest request) {
        ClinicalAttention ca = clinicalAttentionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("ClinicalAttention no encontrada: id=" + id));

        if (!Objects.equals(ca.getVersion(), request.getVersion())) {
            throw new OptimisticLockException("Version desactualizada");
        }

        Map<String, Object> updated = new LinkedHashMap<>();

        apply(updated, "visitDate", request.getVisitDate(), ca::setVisitDate, ca::getVisitDate);
        apply(updated, "status", request.getStatus(), ca::setStatus, ca::getStatus);
        applyStr(updated, "subjective", request.getSubjective(), ca::setSubjective, ca::getSubjective);
        applyStr(updated, "objective", request.getObjective(), ca::setObjective, ca::getObjective);
        applyStr(updated, "assessment", request.getAssessment(), ca::setAssessment, ca::getAssessment);
        applyStr(updated, "plan", request.getPlan(), ca::setPlan, ca::getPlan);
        apply(updated, "weightKg", request.getWeightKg(), ca::setWeightKg, ca::getWeightKg);
        apply(updated, "temperatureCelsius", request.getTemperatureCelsius(), ca::setTemperatureCelsius, ca::getTemperatureCelsius);
        apply(updated, "heartRate", request.getHeartRate(), ca::setHeartRate, ca::getHeartRate);
        apply(updated, "respiratoryRate", request.getRespiratoryRate(), ca::setRespiratoryRate, ca::getRespiratoryRate);

        ClinicalAttention flushedCa = clinicalAttentionRepository.saveAndFlush(ca);

        ClinicalAttentionSummaryResponse summary = ClinicalAttentionMapper.toSummary(flushedCa);

        return ClinicalAttentionPatchResponse.builder()
                .id(flushedCa.getId())
                .version(flushedCa.getVersion())
                .status(flushedCa.getStatus())
                .updated(updated)
                .summary(summary)
                .build();
    }

    @Transactional
    public ClinicalAttentionDetailResponse registerMedication(Long id, AddClinicalAttentionMedicationRequest request) {
        ClinicalAttention clinicalAttention = clinicalAttentionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("ClinicalAttention no encontrada: id=" + id));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: id=" + request.getProductId()));

        Employee administeredBy = request.getAdministeredByEmployeeId() != null
                ? employeeRepository.findById(request.getAdministeredByEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: id=" + request.getAdministeredByEmployeeId()))
                : null;

        Animal animal = resolveAnimal(clinicalAttention);

        MedicationAdministration medication = MedicationAdministration.builder()
                .clinicalAttention(clinicalAttention)
                .animal(animal)
                .product(product)
                .administeredAt(request.getAdministeredAt())
                .doseAmount(request.getDoseAmount())
                .doseUnit(request.getDoseUnit())
                .route(request.getRoute())
                .frequencyUnit(request.getFrequencyUnit())
                .frequencyValue(request.getFrequencyValue())
                .administeredBy(administeredBy)
                .notes(normalize(request.getNotes()))
                .build();

        MedicationAdministration saved = medicationAdministrationRepository.save(medication);
        clinicalAttention.getMedicationAdministrations().add(saved);

        return ClinicalAttentionMapper.toDetail(clinicalAttention);
    }

    @Transactional
    public ClinicalAttentionDetailResponse addServiceItem(Long id, AddClinicalAttentionServiceItemRequest request) {
        ClinicalAttention clinicalAttention = clinicalAttentionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("ClinicalAttention no encontrada: id=" + id));

        ClinicalService service = clinicalServiceRepository.findById(request.getClinicalServiceId())
                .orElseThrow(() -> new IllegalArgumentException("Servicio clínico no encontrado: id=" + request.getClinicalServiceId()));

        BigDecimal subtotal = request.getUnitPrice().multiply(request.getQuantity());

        ClinicalServiceItem item = ClinicalServiceItem.builder()
                .clinicalAttention(clinicalAttention)
                .clinicalService(service)
                .unitPrice(request.getUnitPrice())
                .quantity(request.getQuantity())
                .subtotal(subtotal)
                .notes(normalize(request.getNotes()))
                .build();

        if (request.getProducts() != null && !request.getProducts().isEmpty()) {
            List<ClinicalServiceProduct> products = request.getProducts().stream().map(pr -> {
                Product product = productRepository.findById(pr.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: id=" + pr.getProductId()));

                return ClinicalServiceProduct.builder()
                        .product(product)
                        .dose(pr.getDose())
                        .unit(pr.getUnit())
                        .administrationRoute(pr.getAdministrationRoute())
                        .build();
            }).toList();

            item.setProducts(new HashSet<>(products));
        } else {
            item.setProducts(Collections.emptySet());
        }

        ClinicalServiceItem saved = clinicalServiceItemRepository.save(item);

        clinicalAttention.getServiceItems().add(saved);

        return ClinicalAttentionMapper.toDetail(clinicalAttention);
    }

    @Transactional
    public ClinicalAttentionDetailResponse addSurgicalOrder(Long id, AddClinicalAttentionSurgicalOrderRequest request) {
        ClinicalAttention clinicalAttention = clinicalAttentionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("ClinicalAttention no encontrada: id=" + id));

        ClinicalService service = clinicalServiceRepository.findById(request.getRecommendedServiceId())
                .orElseThrow(() -> new IllegalArgumentException("Servicio clínico no encontrado: id=" + request.getRecommendedServiceId()));
        if (service.getClinicalServiceCategory() != ClinicalServiceCategory.SURGERY) {
            throw new IllegalArgumentException("El servicio recomendado debe pertenecer a la categoría SURGERY.");
        }

        Employee requestedBy = employeeRepository.findById(request.getRequestedByEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: id=" + request.getRequestedByEmployeeId()));

        OperatingRoom room = null;
        if (request.getOperatingRoomId() != null) {
            Long roomId = request.getOperatingRoomId();
            room = operatingRoomRepository.findById(roomId)
                    .orElseThrow(() -> new IllegalArgumentException("Sala de operaciones no encontrada: id=" + roomId));
        }

        Animal animal = resolveAnimal(clinicalAttention);

        SurgicalOrder order = SurgicalOrder.builder()
                .animal(animal)
                .recommendedService(service)
                .requestedBy(requestedBy)
                .status(request.getStatus() != null ? request.getStatus() : SurgicalOrderStatus.PENDING)
                .notes(normalize(request.getNotes()))
                .clinicalAttention(clinicalAttention)
                .operatingRoom(room)
                .build();

        SurgicalOrder saved = surgicalOrderRepository.save(order);
        clinicalAttention.getSurgicalOrders().add(saved);

        return ClinicalAttentionMapper.toDetail(clinicalAttention);
    }

    @Transactional
    public ClinicalAttentionDetailResponse addLaboratoryRequest(Long id, AddClinicalAttentionLaboratoryRequest request) {
        ClinicalAttention clinicalAttention = clinicalAttentionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("ClinicalAttention no encontrada: id=" + id));

        Laboratory laboratory = laboratoryRepository.findWithBranchById(request.getLaboratoryId())
                .orElseThrow(() -> new IllegalArgumentException("Laboratorio no encontrado: id=" + request.getLaboratoryId()));

        Employee requestingEmployee = request.getRequestingEmployeeId() != null
                ? employeeRepository.findById(request.getRequestingEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: id=" + request.getRequestingEmployeeId()))
                : null;

        Animal animal = resolveAnimal(clinicalAttention);

        LaboratoryRequest laboratoryRequest = LaboratoryRequest.builder()
                .clinicalAttention(clinicalAttention)
                .animal(animal)
                .requestingEmployee(requestingEmployee)
                .laboratory(laboratory)
                .status(request.getStatus() != null ? request.getStatus() : LabRequestStatus.REQUESTED)
                .createdAt(request.getCreatedAt() != null ? request.getCreatedAt() : LocalDateTime.now())
                .clinicalNotes(normalize(request.getClinicalNotes()))
                .items(new HashSet<>())
                .build();

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Debe registrar al menos una prueba de laboratorio.");
        }

        request.getItems().forEach(itemRequest -> {
            LaboratoryTest test = laboratoryTestRepository.findById(itemRequest.getTestId())
                    .orElseThrow(() -> new IllegalArgumentException("Prueba de laboratorio no encontrada: id=" + itemRequest.getTestId()));

            LaboratoryRequestItem item = LaboratoryRequestItem.builder()
                    .laboratoryRequest(laboratoryRequest)
                    .test(test)
                    .status(LabRequestItemStatus.REQUESTED)
                    .unitPrice(itemRequest.getUnitPrice())
                    .quantity(itemRequest.getQuantity())
                    .subtotal(itemRequest.getUnitPrice().multiply(itemRequest.getQuantity()))
                    .notes(normalize(itemRequest.getNotes()))
                    .build();
            laboratoryRequest.getItems().add(item);
        });

        LaboratoryRequest saved = laboratoryRequestRepository.save(laboratoryRequest);
        clinicalAttention.getLaboratoryRequests().add(saved);

        return ClinicalAttentionMapper.toDetail(clinicalAttention);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<ClinicalAttentionSummaryResponse> list(
            List<ClinicalAttentionStatus> statuses,
            Long branchId,
            Long animalId,
            Long attentionId,
            Long attendingEmployeeId,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("visitDate").descending());

        Page<ClinicalAttention> result = clinicalAttentionRepository.findAll(
                ClinicalAttentionSpecs.byFilters(
                        statuses,
                        branchId,
                        animalId,
                        attentionId,
                        attendingEmployeeId,
                        startDate,
                        endDate
                ),
                pageable
        );

        List<ClinicalAttentionSummaryResponse> content = result.getContent().stream()
                .map(ClinicalAttentionMapper::toSummary)
                .collect(Collectors.toList());

        return PaginatedResponse.<ClinicalAttentionSummaryResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public List<ClinicalAttentionStatusGroupResponse> listActiveGroupedByStatus(Long attendingEmployeeId) {
        Sort sort = Sort.by(Sort.Order.asc("status"), Sort.Order.desc("visitDate"));

        List<ClinicalAttention> attentions = clinicalAttentionRepository.findAll(
                ClinicalAttentionSpecs.activeByAttendingEmployee(attendingEmployeeId),
                sort
        );

        Map<ClinicalAttentionStatus, List<ClinicalAttention>> grouped = attentions.stream()
                .collect(Collectors.groupingBy(
                        ClinicalAttention::getStatus,
                        () -> new EnumMap<>(ClinicalAttentionStatus.class),
                        Collectors.toList()
                ));

        // Ensure all active statuses are present even if empty
        Set<ClinicalAttentionStatus> activeStatuses = Set.of(
                ClinicalAttentionStatus.OPEN,
                ClinicalAttentionStatus.IN_PROGRESS,
                ClinicalAttentionStatus.WAITING_LAB,
                ClinicalAttentionStatus.READY_TO_BILL
        );
        activeStatuses.forEach(status -> grouped.computeIfAbsent(status, key -> List.of()));

        return ClinicalAttentionMapper.toStatusGroups(grouped);
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

    private Branch resolveBranch(ClinicalAttention clinicalAttention) {
        Branch branch = resolveBranchOrNull(clinicalAttention);
        if (branch == null) {
            throw new IllegalStateException("La atención no tiene una sucursal asociada.");
        }
        return branch;
    }

    private Branch resolveBranchOrNull(ClinicalAttention clinicalAttention) {
        Attentions attention = clinicalAttention.getAttention();
        return attention != null ? attention.getBranch() : null;
    }

    private Animal resolveAnimal(ClinicalAttention clinicalAttention) {
        Attentions attention = clinicalAttention.getAttention();
        if (attention == null || attention.getAnimal() == null) {
            throw new IllegalStateException("La atención no tiene un animal asociado.");
        }
        return attention.getAnimal();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
