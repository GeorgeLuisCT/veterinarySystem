package com.gaedet.biocampovet.core.clinic.service;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.repository.AnimalRepository;
import com.gaedet.biocampovet.core.branches.entity.Laboratory;
import com.gaedet.biocampovet.core.branches.repository.LaboratoryRepository;
import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryRequest;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryRequestItem;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryResultValue;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryTest;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryTestParameter;
import com.gaedet.biocampovet.core.clinic.enums.LabRequestItemStatus;
import com.gaedet.biocampovet.core.clinic.enums.LabRequestStatus;
import com.gaedet.biocampovet.core.clinic.repository.LaboratoryRequestItemRepository;
import com.gaedet.biocampovet.core.clinic.repository.LaboratoryRequestRepository;
import com.gaedet.biocampovet.core.clinic.repository.LaboratoryResultValueRepository;
import com.gaedet.biocampovet.core.clinic.repository.LaboratoryTestParameterRepository;
import com.gaedet.biocampovet.core.clinic.repository.LaboratoryTestRepository;
import com.gaedet.biocampovet.core.clinic.specs.LaboratoryRequestSpecs;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.employees.repository.EmployeeRepository;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
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
                .orElseThrow(() -> new IllegalArgumentException("Solicitud de laboratorio no encontrada: id=" + id));
        return LaboratoryRequestDetailResponse.fromEntity(request);
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

        request.getResults().forEach(resultItem -> {
            LaboratoryTestParameter parameter = laboratoryTestParameterRepository.findById(resultItem.getParameterId())
                    .orElseThrow(() -> new IllegalArgumentException("Parámetro de prueba no encontrado: id=" + resultItem.getParameterId()));

            LaboratoryResultValue resultValue = item.getResults().stream()
                    .filter(r -> r.getParameter().getId().equals(resultItem.getParameterId()))
                    .findFirst()
                    .orElse(LaboratoryResultValue.builder().requestItem(item).parameter(parameter).build());

            resultValue.setNumericValue(resultItem.getNumericValue());
            resultValue.setTextValue(resultItem.getTextValue());
            resultValue.setBooleanValue(resultItem.getBooleanValue());
            resultValue.setComment(resultItem.getComment());

            item.getResults().add(resultValue);
        });
        
        // Potentially update item status
        item.setStatus(LabRequestItemStatus.WITH_RESULTS);
        
        LaboratoryRequestItem savedItem = laboratoryRequestItemRepository.save(item);

        return getDetail(savedItem.getLaboratoryRequest().getId());
    }
}
