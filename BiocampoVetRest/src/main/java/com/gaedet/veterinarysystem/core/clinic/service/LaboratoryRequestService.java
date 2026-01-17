package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.animal.repository.AnimalRepository;
import com.gaedet.veterinarysystem.core.branches.entity.Laboratory;
import com.gaedet.veterinarysystem.core.branches.repository.LaboratoryRepository;
import com.gaedet.veterinarysystem.core.clinic.dto.*;
import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryRequest;
import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryRequestItem;
import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryResultValue;
import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryTest;
import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryTestParameter;
import com.gaedet.veterinarysystem.core.clinic.enums.LabRequestItemStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.LabRequestStatus;
import com.gaedet.veterinarysystem.core.clinic.mapper.LaboratoryRequestMapper;
import com.gaedet.veterinarysystem.core.clinic.repository.LaboratoryRequestItemRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.LaboratoryRequestRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.LaboratoryResultValueRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.LaboratoryTestParameterRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.LaboratoryTestRepository;
import com.gaedet.veterinarysystem.core.clinic.specs.LaboratoryRequestSpecs;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.repository.EmployeeRepository;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LaboratoryRequestService {

    private final LaboratoryRequestRepository laboratoryRequestRepository;
    private final LaboratoryRequestItemRepository laboratoryRequestItemRepository;
    private final LaboratoryResultValueRepository laboratoryResultValueRepository;
    private final LaboratoryTestRepository laboratoryTestRepository;
    private final LaboratoryTestParameterRepository laboratoryTestParameterRepository;
    private final AnimalRepository animalRepository;
    private final LaboratoryRepository laboratoryRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public PaginatedResponse<LaboratoryRequestSummaryResponse> list(
            List<LabRequestStatus> statuses,
            Long branchId,
            Long animalId,
            Long laboratoryId,
            Long requestingEmployeeId,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("createdAt").descending());
        Page<LaboratoryRequest> result = laboratoryRequestRepository.findAll(
                LaboratoryRequestSpecs.byFilters(
                        statuses, branchId, animalId, laboratoryId, requestingEmployeeId, startDate, endDate
                ),
                pageable
        );
        List<LaboratoryRequestSummaryResponse> content = result.getContent().stream()
                .map(LaboratoryRequestSummaryResponse::fromEntity)
                .collect(Collectors.toList());

        return PaginatedResponse.<LaboratoryRequestSummaryResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public LaboratoryRequestDetailResponse getDetail(Long id) {
        LaboratoryRequest request = laboratoryRequestRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Solicitud de laboratorio no encontrada: id=" + id
                ));
        return LaboratoryRequestMapper.fromEntity(request);
    }

    @Transactional
    public LaboratoryRequestDetailResponse create(CreateLaboratoryRequest request) {
        Animal animal = animalRepository.findById(request.getAnimalId())
                .orElseThrow(() -> new IllegalArgumentException("Animal no encontrado: id=" + request.getAnimalId()));

        Laboratory laboratory = laboratoryRepository.findById(request.getLaboratoryId())
                .orElseThrow(() -> new IllegalArgumentException("Laboratorio no encontrado: id=" + request.getLaboratoryId()));

        Employee requestingEmployee = request.getRequestingEmployeeId() != null
                ? employeeRepository.findById(request.getRequestingEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: id=" + request.getRequestingEmployeeId()))
                : null;

        LaboratoryRequest laboratoryRequest = LaboratoryRequest.builder()
                .animal(animal)
                .laboratory(laboratory)
                .requestingEmployee(requestingEmployee)
                .status(LabRequestStatus.REQUESTED)
                .createdAt(LocalDateTime.now())
                .clinicalNotes(request.getClinicalNotes())
                .items(new HashSet<>())
                .build();

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
                    .notes(itemRequest.getNotes())
                    .build();
            laboratoryRequest.getItems().add(item);
        });

        LaboratoryRequest saved = laboratoryRequestRepository.save(laboratoryRequest);
        return getDetail(saved.getId());
    }

    @Transactional
    public LaboratoryRequestDetailResponse addResults(Long requestItemId, AddResultValuesRequest request) {
        LaboratoryRequestItem item = laboratoryRequestItemRepository.findById(requestItemId)
                .orElseThrow(() -> new IllegalArgumentException("Item de solicitud de laboratorio no encontrado: id=" + requestItemId));

        // Asegura colección inicializada
        if (item.getResults() == null) {
            item.setResults(new HashSet<>());
        }

        // Mapea parámetros válidos del test del item (para validar pertenencia)
        Set<Long> validParameterIds = item.getTest().getParameters().stream()
                .map(LaboratoryTestParameter::getId)
                .collect(Collectors.toSet());

        // Indexa resultados existentes por parameterId para reusar y no duplicar
        Map<Long, LaboratoryResultValue> existingByParam = item.getResults().stream()
                .collect(Collectors.toMap(rv -> rv.getParameter().getId(), rv -> rv));

        for (AddResultValuesRequest.ResultValueItem r : request.getResults()) {
            Long paramId = r.getParameterId();

            if (!validParameterIds.contains(paramId)) {
                throw new IllegalArgumentException("El parámetro no pertenece a la prueba del item: parameterId=" + paramId);
            }

            LaboratoryTestParameter parameter = laboratoryTestParameterRepository.findById(paramId)
                    .orElseThrow(() -> new IllegalArgumentException("Parámetro de prueba no encontrado: id=" + paramId));

            // Recupera o crea el contenedor del valor
            LaboratoryResultValue value = existingByParam.get(paramId);
            if (value == null) {
                value = LaboratoryResultValue.builder()
                        .requestItem(item)
                        .parameter(parameter)
                        .build();
                item.getResults().add(value);
                existingByParam.put(paramId, value);
            }

            // Normaliza valores: solo uno no-nulo según el tipo
            value.setNumericValue(null);
            value.setTextValue(null);
            value.setBooleanValue(null);

            switch (parameter.getValueType()) {
                case NUMERIC -> {
                    value.setNumericValue(r.getNumericValue());
                    if (r.getNumericValue() == null) {
                        // Permite vacío -> queda sin resultado; lo tratamos al final para el estado
                        break;
                    }
                    // Cálculo outOfRange y flag (si tienes refMin/refMax)
                    Double v = r.getNumericValue();
                    Double refMin = parameter.getRefMin();
                    Double refMax = parameter.getRefMax();
                    Boolean out = null;
                    String flag = null;
                    if (refMin != null && v < refMin) { out = true; flag = "BAJO"; }
                    else if (refMax != null && v > refMax) { out = true; flag = "ALTO"; }
                    else if (refMin != null || refMax != null) { out = false; }

                    value.setOutOfRange(out);
                    value.setFlag(flag);
                }
                case TEXT -> {
                    if (r.getTextValue() != null && !r.getTextValue().isBlank()) {
                        value.setTextValue(r.getTextValue().trim());
                    }
                }
                case SELECT -> {
                    if (r.getTextValue() != null && !r.getTextValue().isBlank()) {
                        String chosen = r.getTextValue().trim();
                        // Validación de opción (si definiste allowedOptions)
                        if (parameter.getAllowedOptions() != null && !parameter.getAllowedOptions().isBlank()) {
                            Set<String> opts = Arrays.stream(parameter.getAllowedOptions().split(","))
                                    .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toSet());
                            if (!opts.contains(chosen)) {
                                throw new IllegalArgumentException("Opción inválida para SELECT: " + chosen);
                            }
                        }
                        value.setTextValue(chosen);
                    }
                }
                case BOOLEAN -> {
                    if (r.getBooleanValue() != null) {
                        value.setBooleanValue(r.getBooleanValue());
                    }
                }
            }

            // Unit override si llega en el request
            value.setUnitOverride(
                    (r.getUnitOverride() != null && !r.getUnitOverride().isBlank())
                            ? r.getUnitOverride().trim()
                            : null
            );

            // Comentario
            value.setComment(r.getComment());

            // Si tienes @AssertTrue en isValueMatchesType, asegúrate que parameter ya está seteado (lo está).
            // Dejará invalida la entidad si el valor no coincide con el tipo (bueno).
        }

        // Estado del item: WITH_RESULTS si TODOS los parámetros tienen algún valor, IN_PROGRESS si parcial
        boolean anyResult = false;
        boolean allHaveResult = true;

        for (LaboratoryTestParameter p : item.getTest().getParameters()) {
            LaboratoryResultValue v = existingByParam.get(p.getId());
            boolean hasValue = v != null && (
                    v.getNumericValue() != null ||
                            (v.getTextValue() != null && !v.getTextValue().isBlank()) ||
                            v.getBooleanValue() != null
            );
            anyResult |= hasValue;
            allHaveResult &= hasValue;
        }

        if (allHaveResult) {
            item.setStatus(LabRequestItemStatus.WITH_RESULTS);
        } else if (anyResult) {
            item.setStatus(LabRequestItemStatus.IN_PROCESS);
        } else {
            item.setStatus(LabRequestItemStatus.REQUESTED);
        }

        // Persistencia: requiere cascade PERSIST/MERGE en LaboratoryRequestItem.results.
        LaboratoryRequestItem savedItem = laboratoryRequestItemRepository.save(item);

        // (Opcional) actualiza estado de la solicitud completa si todos sus items ya están con resultados
        LaboratoryRequest parent = savedItem.getLaboratoryRequest();
        boolean allItemsWithResults = parent.getItems().stream()
                .allMatch(i -> i.getStatus() == LabRequestItemStatus.WITH_RESULTS);
        if (allItemsWithResults) {
            parent.setStatus(LabRequestStatus.COMPLETED);
            laboratoryRequestRepository.save(parent);
        }

        return getDetail(parent.getId());
    }

    @Transactional
    public LaboratoryRequestDetailResponse updateRequestStatus(Long requestId, LabRequestStatus newStatus) {
        LaboratoryRequest req = laboratoryRequestRepository.findWithDetailsById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud de laboratorio no encontrada: id=" + requestId));

        if (req.getStatus() == LabRequestStatus.CANCELED) {
            throw new IllegalStateException("No se puede cambiar el estado de una solicitud cancelada.");
        }

        req.setStatus(newStatus);
        laboratoryRequestRepository.save(req);
        return LaboratoryRequestMapper.fromEntity(req);
    }

}
