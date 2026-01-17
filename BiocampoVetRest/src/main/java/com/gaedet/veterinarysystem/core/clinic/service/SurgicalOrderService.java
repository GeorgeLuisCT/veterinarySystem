package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.animal.repository.AnimalRepository;
import com.gaedet.veterinarysystem.core.branches.entity.OperatingRoom;
import com.gaedet.veterinarysystem.core.branches.repository.OperatingRoomRepository;
import com.gaedet.veterinarysystem.core.clinic.dto.CreateSurgicalOrderRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalOrderResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.SurgicalOrderSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.UpdateSurgicalOrderRequest;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalService;
import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalOrder;
import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalOrderStatus;
import com.gaedet.veterinarysystem.core.clinic.mapper.SurgicalOrderMapper;
import com.gaedet.veterinarysystem.core.clinic.repository.ClinicalServiceRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.SurgicalOrderRepository;
import com.gaedet.veterinarysystem.core.clinic.specs.SurgicalOrderSpecs;
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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SurgicalOrderService {

    private final SurgicalOrderRepository surgicalOrderRepository;
    private final AnimalRepository animalRepository;
    private final ClinicalServiceRepository clinicalServiceRepository;
    private final EmployeeRepository employeeRepository;
    private final OperatingRoomRepository operatingRoomRepository;

    @Transactional(readOnly = true)
    public PaginatedResponse<SurgicalOrderResponse> list(
            SurgicalOrderStatus status,
            Long animalId,
            Long branchId,
            Long recommendedServiceId,
            int page,
            int size
    ) {

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("createdAt").descending());
        Page<SurgicalOrder> result = surgicalOrderRepository.findAll(
                SurgicalOrderSpecs.byFilters(status, animalId, branchId, recommendedServiceId),
                pageable
        );

        List<SurgicalOrderResponse> content = result.getContent().stream()
                .map(SurgicalOrderMapper::toResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<SurgicalOrderResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public SurgicalOrderResponse getById(Long id) {
        SurgicalOrder order = surgicalOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Orden quirúrgica no encontrada: id=" + id));
        return SurgicalOrderMapper.toResponse(order);
    }

    @Transactional
    public SurgicalOrderResponse create(CreateSurgicalOrderRequest request) {
        Animal animal = getAnimalOrThrow(request.getAnimalId());
        ClinicalService service = getSurgicalServiceOrThrow(request.getRecommendedServiceId());
        Employee requestedBy = getEmployeeOrThrow(request.getRequestedById());
        OperatingRoom operatingRoom = getOperatingRoomOrThrow(request.getOperationRoomId());

        SurgicalOrder order = SurgicalOrder.builder()
                .animal(animal)
                .operatingRoom(operatingRoom)
                .recommendedService(service)
                .requestedBy(requestedBy)
                .status(request.getStatus() != null ? request.getStatus() : SurgicalOrderStatus.PENDING)
                .notes(normalize(request.getNotes()))
                .build();

        SurgicalOrder saved = surgicalOrderRepository.save(order);
        return SurgicalOrderMapper.toResponse(saved);
    }

    @Transactional
    public SurgicalOrderResponse update(Long id, UpdateSurgicalOrderRequest request) {
        SurgicalOrder order = surgicalOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Orden quirúrgica no encontrada: id=" + id));

        if (request.getRecommendedServiceId() != null) {
            ClinicalService service = getSurgicalServiceOrThrow(request.getRecommendedServiceId());
            order.setRecommendedService(service);
        }

        if (request.getRequestedById() != null) {
            Employee employee = getEmployeeOrThrow(request.getRequestedById());
            order.setRequestedBy(employee);
        }

        if (request.getOperatingRoomId() != null) {
            OperatingRoom room =  getOperatingRoomOrThrow(request.getOperatingRoomId());
            order.setOperatingRoom(room);
        }

        if (request.getNotes() != null) {
            order.setNotes(normalize(request.getNotes()));
        }

        if (request.getStatus() != null) {
            order.setStatus(request.getStatus());
        }

        return SurgicalOrderMapper.toResponse(order);
    }

    @Transactional
    public void delete(Long id) {
        SurgicalOrder order = surgicalOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Orden quirúrgica no encontrada: id=" + id));

        if (order.getScheduledDetail() != null) {
            throw new IllegalStateException("No se puede eliminar una orden que ya está asociada a una cita quirúrgica.");
        }

        surgicalOrderRepository.delete(order);
    }

    @Transactional(readOnly = true)
    public List<SurgicalOrderSummaryResponse> getPendingByAnimal(Long animalId) {
        return surgicalOrderRepository.findByAnimal_IdAndStatus(animalId, SurgicalOrderStatus.PENDING)
                .stream()
                .map(SurgicalOrderMapper::toSummary)
                .collect(Collectors.toList());
    }

    private Animal getAnimalOrThrow(Long id) {
        return animalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Animal no encontrado: id=" + id));
    }

    private ClinicalService getSurgicalServiceOrThrow(Long id) {
        ClinicalService service = clinicalServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Servicio clínico no encontrado: id=" + id));
        if (service.getClinicalServiceCategory() != ClinicalServiceCategory.SURGERY) {
            throw new IllegalArgumentException("El servicio clínico debe pertenecer a la categoría SURGERY.");
        }
        return service;
    }

    private OperatingRoom getOperatingRoomOrThrow(Long id) {
        return operatingRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sala de operaciones no encontrada: id=" + id));
    }

    private Employee getEmployeeOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: id=" + id));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
