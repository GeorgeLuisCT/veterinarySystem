package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.animal.repository.AnimalRepository;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.branches.repository.BranchRepository;
import com.gaedet.veterinarysystem.core.clinic.dto.*;
import com.gaedet.veterinarysystem.core.clinic.entity.Appointment;
import com.gaedet.veterinarysystem.core.clinic.entity.Attentions;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalService;
import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalAppointmentDetail;
import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalOrder;
import com.gaedet.veterinarysystem.core.clinic.enums.AppointmentStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.AppointmentType;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionType;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionsStatus;
import com.gaedet.veterinarysystem.core.clinic.mapper.AttentionMapper;
import com.gaedet.veterinarysystem.core.clinic.repository.AppointmentRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.AttentionRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.ClinicalServiceRepository;
import com.gaedet.veterinarysystem.core.clinic.specs.AttentionSpecs;
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
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttentionService {

    private final AttentionRepository attentionRepository;
    private final AppointmentRepository appointmentRepository;
    private final BranchRepository branchRepository;
    private final AnimalRepository animalRepository;
    private final EmployeeRepository employeeRepository;
    private final ClinicalServiceRepository clinicalServiceRepository;

    @Transactional(readOnly = true)
    public PaginatedResponse<AttentionResponse> list(
            AttentionType type,
            AttentionsStatus status,
            Long branchId,
            Long animalId,
            Boolean emergency,
            Long appointmentId,
            Long clinicalServiceId,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("checkInTime").descending());

        LocalDateTime from = (startDate != null) ? startDate.atStartOfDay() : null;
        LocalDateTime to = (endDate != null) ? endDate.plusDays(1).atStartOfDay() : null;

        Page<Attentions> result = attentionRepository.findAll(
                AttentionSpecs.byFilters(type, status, branchId, animalId, emergency, appointmentId, clinicalServiceId, from, to),
                pageable
        );

        List<AttentionResponse> responses = result.getContent().stream()
                .map(AttentionMapper::toResponse)
                .toList();

        return PaginatedResponse.<AttentionResponse>builder()
                .content(responses)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public AttentionResponse getById(Long id) {
        Attentions attention = attentionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Atención no encontrada: id=" + id));
        return AttentionMapper.toResponse(attention);
    }

    @Transactional
    public AttentionResponse create(CreateAttentionRequest request) {
        Branch branch = getBranchOrThrow(request.getBranchId());
        Animal animal = getAnimalOrThrow(request.getAnimalId());
        Employee employee = getEmployeeOrThrow(request.getAttendingEmployeeId());
        ClinicalService service = getClinicalServiceOrThrow(request.getClinicalServiceId());

        Attentions attention = Attentions.builder()
                .branch(branch)
                .animal(animal)
                .attendingEmployee(employee)
                .checkInTime(request.getCheckInTime())
                .type(request.getType())
                .isEmergency(Boolean.TRUE.equals(request.getEmergency()))
                .status(request.getStatus())
                .service(service)
                .build();

        Attentions saved = attentionRepository.save(attention);
        return AttentionMapper.toResponse(saved);
    }

    @Transactional
    public AttentionResponse createFromAppointment(CreateAttentionFromAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findWithDetailsById(request.getAppointmentId())
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada: id=" + request.getAppointmentId()));

        attentionRepository.findByAppointmentId(appointment.getId())
                .ifPresent(existing -> {
                    throw new IllegalStateException("La cita ya tiene una atención registrada.");
                });

        Branch branch = appointment.getBranch();
        if (branch == null) {
            throw new IllegalStateException("La cita no tiene una sucursal asociada.");
        }

        Animal animal = appointment.getAnimal();
        if (animal == null) {
            throw new IllegalStateException("La cita no tiene un animal asociado.");
        }

        Employee attendingEmployee = resolveAttendingEmployee(appointment, request.getAttendingEmployeeId());
        if (appointment.getAssignedEmployee() == null && attendingEmployee != null) {
            appointment.setAssignedEmployee(attendingEmployee);
        }

        LocalDateTime checkInTime = request.getCheckInTime() != null ? request.getCheckInTime() : LocalDateTime.now();
        AttentionsStatus status = request.getStatus() != null ? request.getStatus() : AttentionsStatus.WAITING;
        AttentionType type = mapFromAppointmentType(appointment.getType());
        ClinicalService service = resolveServiceFromAppointment(appointment);
        SurgicalOrder surgicalOrder = resolveOrderFromAppointment(appointment);

        Attentions attention = Attentions.builder()
                .appointment(appointment)
                .branch(branch)
                .animal(animal)
                .attendingEmployee(attendingEmployee)
                .checkInTime(checkInTime)
                .type(type)
                .isEmergency(Boolean.TRUE.equals(request.getEmergency()))
                .status(status)
                .service(service)
                .surgicalOrder(surgicalOrder)
                .build();

        Attentions saved = attentionRepository.save(attention);
        syncAppointmentStatus(saved);

        return AttentionMapper.toResponse(saved);
    }

    @Transactional
    public AttentionResponse updateStatus(Long id, UpdateAttentionStatusRequest request) {
        Attentions attention = attentionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Atención no encontrada: id=" + id));

        attention.setStatus(request.getStatus());
        syncAppointmentStatus(attention);

        return AttentionMapper.toResponse(attention);
    }

    @Transactional
    public AttentionResponse updateAttendingEmployee(Long id, UpdateAttentionAttendingEmployeeRequest request) {
        Attentions attention = attentionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Atención no encontrada: id=" + id));

        Employee employee = getEmployeeOrThrow(request.getAttendingEmployeeId());
        attention.setAttendingEmployee(employee);

        Appointment appointment = attention.getAppointment();
        if (appointment != null) {
            appointment.setAssignedEmployee(employee);
        }

        return AttentionMapper.toResponse(attention);
    }

    @Transactional
    public void delete(Long id) {
        Attentions attention = attentionRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Atención no encontrada: id=" + id));

        Appointment appointment = attention.getAppointment();
        if (appointment != null) {
            AppointmentStatus rollbackStatus = rollbackAppointmentStatus(attention);
            if (rollbackStatus != null) {
                appointment.setStatus(rollbackStatus);
            }
        }

        attentionRepository.delete(attention);
    }

    private void syncAppointmentStatus(Attentions attention) {
        Appointment appointment = attention.getAppointment();
        if (appointment == null) {
            return;
        }

        AppointmentStatus status = mapToAppointmentStatus(attention.getStatus());
        if (status != null && appointment.getStatus() != status) {
            appointment.setStatus(status);
        }
    }

    private AppointmentStatus rollbackAppointmentStatus(Attentions attention) {
        return switch (attention.getStatus()) {
            case WAITING -> AppointmentStatus.SCHEDULED;
            case IN_CONSULTATION -> AppointmentStatus.CHECKED_IN;
            case IN_PROGRESS -> AppointmentStatus.CHECKED_IN;
            case FINISHED -> AppointmentStatus.IN_PROGRESS;
        };
    }

    private AppointmentStatus mapToAppointmentStatus(AttentionsStatus status) {
        return switch (status) {
            case WAITING -> AppointmentStatus.CHECKED_IN;
            case IN_CONSULTATION -> AppointmentStatus.IN_PROGRESS;
            case IN_PROGRESS -> AppointmentStatus.IN_PROGRESS;
            case FINISHED -> AppointmentStatus.COMPLETED;
        };
    }

    private AttentionType mapFromAppointmentType(AppointmentType type) {
        if (type == null) {
            throw new IllegalStateException("La cita no tiene tipo configurado.");
        }
        try {
            return AttentionType.valueOf(type.name());
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("Tipo de cita no soportado para atención: " + type);
        }
    }

    private Employee resolveAttendingEmployee(Appointment appointment, Long employeeId) {
        if (employeeId != null) {
            return getEmployeeOrThrow(employeeId);
        }
        Employee fromAppointment = appointment.getAssignedEmployee();
        if (fromAppointment == null) {
            throw new IllegalArgumentException("Debe indicar un empleado responsable para registrar la atención.");
        }
        return fromAppointment;
    }

    private ClinicalService resolveServiceFromAppointment(Appointment appointment) {
        ClinicalService service = null;
        if (appointment.getType() == AppointmentType.CLINIC && appointment.getClinicalDetail() != null) {
            service = appointment.getClinicalDetail().getClinicalService();
        } else if (appointment.getType() == AppointmentType.GROOMING && appointment.getGroomingDetail() != null) {
            service = appointment.getGroomingDetail().getClinicalService();
        } else if (appointment.getType() == AppointmentType.SURGERY && appointment.getSurgicalDetail() != null) {
            service = appointment.getSurgicalDetail().getFinalService();
        }

        if (service == null) {
            throw new IllegalStateException("No se pudo determinar el servicio clínico asociado a la cita.");
        }
        return service;
    }

    private SurgicalOrder resolveOrderFromAppointment(Appointment appointment) {
        if (appointment.getType() != AppointmentType.SURGERY) {
            return null;
        }
        SurgicalAppointmentDetail detail = appointment.getSurgicalDetail();
        if (detail == null) {
            throw new IllegalStateException("La cita quirúrgica no tiene detalle registrado.");
        }
        return detail.getOrder();
    }

    private Branch getBranchOrThrow(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada: id=" + id));
    }

    private Animal getAnimalOrThrow(Long id) {
        return animalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Animal no encontrado: id=" + id));
    }

    private Employee getEmployeeOrThrow(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: id=" + id));
    }

    private ClinicalService getClinicalServiceOrThrow(Long id) {
        return clinicalServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Servicio clínico no encontrado: id=" + id));
    }
}
