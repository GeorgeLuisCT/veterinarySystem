package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.animal.repository.AnimalRepository;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.branches.entity.OperatingRoom;
import com.gaedet.veterinarysystem.core.branches.repository.BranchRepository;
import com.gaedet.veterinarysystem.core.branches.repository.OperatingRoomRepository;
import com.gaedet.veterinarysystem.core.clinic.dto.AppointmentDetailResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.AppointmentSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.AssignAppointmentEmployeeRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.CreateClinicalAppointmentRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.CreateGroomingAppointmentRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.CreateSurgicalAppointmentRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.RescheduleAppointmentRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.UpdateAppointmentStatusRequest;
import com.gaedet.veterinarysystem.core.clinic.entity.Appointment;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalAppointmentDetail;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalService;
import com.gaedet.veterinarysystem.core.clinic.entity.GroomingAppointmentDetail;
import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalAppointmentDetail;
import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalOrder;
import com.gaedet.veterinarysystem.core.clinic.enums.AppointmentStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.AppointmentType;
import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalOrderStatus;
import com.gaedet.veterinarysystem.core.clinic.mapper.AppointmentMapper;
import com.gaedet.veterinarysystem.core.clinic.repository.AppointmentRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.ClinicalAppointmentDetailRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.ClinicalServiceRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.GroomingAppointmentDetailRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.SurgicalAppointmentDetailRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.SurgicalOrderRepository;
import com.gaedet.veterinarysystem.core.clinic.specs.AppointmentSpecs;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ClinicalAppointmentDetailRepository clinicalAppointmentDetailRepository;
    private final GroomingAppointmentDetailRepository groomingAppointmentDetailRepository;
    private final SurgicalAppointmentDetailRepository surgicalAppointmentDetailRepository;
    private final SurgicalOrderRepository surgicalOrderRepository;
    private final ClinicalServiceRepository clinicalServiceRepository;
    private final AnimalRepository animalRepository;
    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final OperatingRoomRepository operatingRoomRepository;

    @Transactional
    public AppointmentDetailResponse createClinicalAppointment(CreateClinicalAppointmentRequest request) {
        Animal animal = getAnimalOrThrow(request.getAnimalId());
        ClinicalService service = getClinicalServiceOrThrow(request.getClinicalServiceId());
        Employee veterinarian = getEmployeeOrThrow(request.getVeterinarianId());
        Branch branch = getBranchOrThrow(request.getBranchId());
        assertSchedulable(request.getStartDateTime(), request.getEstimatedDurationMinutes(), veterinarian, animal, null, null);

        Appointment appointment = Appointment.builder()
                .animal(animal)
                .branch(branch)
                .assignedEmployee(veterinarian)
                .startDateTime(request.getStartDateTime())
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes())
                .type(AppointmentType.CLINIC)
                .status(AppointmentStatus.SCHEDULED)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        ClinicalAppointmentDetail detail = ClinicalAppointmentDetail.builder()
                .appointment(saved)
                .clinicalService(service)
                .veterinarian(veterinarian)
                .consultationReason(request.getConsultationReason())
                .clinicalNotes(request.getClinicalNotes())
                .build();

        clinicalAppointmentDetailRepository.save(detail);

        return getDetail(saved.getId());
    }

    @Transactional
    public AppointmentDetailResponse createGroomingAppointment(CreateGroomingAppointmentRequest request) {
        Animal animal = getAnimalOrThrow(request.getAnimalId());
        ClinicalService service = getClinicalServiceOrThrow(request.getClinicalServiceId());
        Employee stylist = getEmployeeOrThrow(request.getStylistId());
        Branch branch = getBranchOrThrow(request.getBranchId());
        assertSchedulable(request.getStartDateTime(), request.getEstimatedDurationMinutes(), stylist, animal, null, null);

        Appointment appointment = Appointment.builder()
                .animal(animal)
                .branch(branch)
                .assignedEmployee(stylist)
                .startDateTime(request.getStartDateTime())
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes())
                .type(AppointmentType.GROOMING)
                .status(AppointmentStatus.SCHEDULED)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        GroomingAppointmentDetail detail = GroomingAppointmentDetail.builder()
                .appointment(saved)
                .clinicalService(service)
                .stylist(stylist)
                .ownerSpecialNotes(request.getOwnerSpecialNotes())
                .build();

        groomingAppointmentDetailRepository.save(detail);

        return getDetail(saved.getId());
    }

    @Transactional
    public AppointmentDetailResponse createSurgicalAppointment(CreateSurgicalAppointmentRequest request) {
        Animal animal = getAnimalOrThrow(request.getAnimalId());
        SurgicalOrder order = null;
        if (request.getOrderId() != null) {
            order = getSurgicalOrderOrThrow(request.getOrderId());
            if (!order.getAnimal().getId().equals(animal.getId())) {
                throw new IllegalArgumentException("La orden quirúrgica no corresponde al animal indicado.");
            }
            if (order.getScheduledDetail() != null) {
                throw new IllegalStateException("La orden quirúrgica ya tiene una cita asignada.");
            }
        }

        ClinicalService finalService = getClinicalServiceOrThrow(request.getFinalServiceId());
        Employee surgeon = getEmployeeOrThrow(request.getSurgeonId());
        Employee anesthetist = request.getAnesthetistId() != null
                ? getEmployeeOrThrow(request.getAnesthetistId())
                : null;
        Branch branch = getBranchOrThrow(request.getBranchId());

        OperatingRoom operatingRoom = request.getOperatingRoomId() != null
                ? getOperatingRoomOrThrow(request.getOperatingRoomId())
                : null;
        assertSchedulable(request.getStartDateTime(), request.getEstimatedDurationMinutes(), surgeon, animal, operatingRoom, null);

        Appointment appointment = Appointment.builder()
                .animal(animal)
                .branch(branch)
                .assignedEmployee(surgeon)
                .startDateTime(request.getStartDateTime())
                .estimatedDurationMinutes(request.getEstimatedDurationMinutes())
                .type(AppointmentType.SURGERY)
                .status(AppointmentStatus.SCHEDULED)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        SurgicalAppointmentDetail detail = SurgicalAppointmentDetail.builder()
                .appointment(saved)
                .order(order)
                .finalService(finalService)
                .surgeon(surgeon)
                .anesthetist(anesthetist)
                .operatingRoom(operatingRoom)
                .prepInstructions(request.getPrepInstructions())
                .build();

        surgicalAppointmentDetailRepository.save(detail);

        if (order != null) {
            order.setScheduledDetail(detail);
            order.setStatus(SurgicalOrderStatus.SCHEDULED);
            surgicalOrderRepository.save(order);
        }

        return getDetail(saved.getId());
    }

    @Transactional(readOnly = true)
    public List<AppointmentSummaryResponse> list(
            AppointmentType type,
            AppointmentStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Long assignedEmployeeId
    ) {
        Specification<Appointment> spec = AppointmentSpecs.byFilters(type, status, startDate, endDate, assignedEmployeeId);
        List<Appointment> appointments = appointmentRepository.findAll(spec, Sort.by("startDateTime").ascending());
        return appointments.stream()
                .map(AppointmentMapper::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public AppointmentDetailResponse getDetail(Long id) {
        Appointment appointment = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada: id=" + id));
        return AppointmentMapper.toDetail(appointment);
    }

    @Transactional
    public AppointmentDetailResponse reschedule(Long id, RescheduleAppointmentRequest request) {
        Appointment appointment = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada: id=" + id));

        if (isFinal(appointment.getStatus())) {
            throw new IllegalStateException("No se puede reprogramar una cita " + appointment.getStatus().name().toLowerCase());
        }
        Integer duration = request.getEstimatedDurationMinutes() != null
                ? request.getEstimatedDurationMinutes() : appointment.getEstimatedDurationMinutes();
        OperatingRoom room = appointment.getSurgicalDetail() != null ? appointment.getSurgicalDetail().getOperatingRoom() : null;
        assertSchedulable(request.getStartDateTime(), duration, appointment.getAssignedEmployee(),
                appointment.getAnimal(), room, appointment.getId());

        appointment.setStartDateTime(request.getStartDateTime());
        if (request.getEstimatedDurationMinutes() != null) {
            appointment.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        }

        return AppointmentMapper.toDetail(appointment);
    }

    @Transactional
    public AppointmentDetailResponse updateStatus(Long id, UpdateAppointmentStatusRequest request) {
        Appointment appointment = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada: id=" + id));

        validateStatusChange(appointment.getStatus(), request.getStatus());
        appointment.setStatus(request.getStatus());
        return AppointmentMapper.toDetail(appointment);
    }

    @Transactional
    public AppointmentDetailResponse assignEmployee(Long id, AssignAppointmentEmployeeRequest request) {
        Appointment appointment = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada: id=" + id));

        Employee employee = getEmployeeOrThrow(request.getEmployeeId());
        if (isFinal(appointment.getStatus())) {
            throw new IllegalStateException("No se puede reasignar una cita " + appointment.getStatus().name().toLowerCase());
        }
        assertSchedulable(appointment.getStartDateTime(), appointment.getEstimatedDurationMinutes(), employee,
                null, null, appointment.getId());
        appointment.setAssignedEmployee(employee);

        if (appointment.getType() == AppointmentType.CLINIC) {
            ClinicalAppointmentDetail detail = appointment.getClinicalDetail();
            if (detail == null) {
                throw new IllegalStateException("La cita clínica no tiene detalle asociado.");
            }
            detail.setVeterinarian(employee);
            clinicalAppointmentDetailRepository.save(detail);
        } else if (appointment.getType() == AppointmentType.GROOMING) {
            GroomingAppointmentDetail detail = appointment.getGroomingDetail();
            if (detail == null) {
                throw new IllegalStateException("La cita de grooming no tiene detalle asociado.");
            }
            detail.setStylist(employee);
            groomingAppointmentDetailRepository.save(detail);
        } else if (appointment.getType() == AppointmentType.SURGERY) {
            SurgicalAppointmentDetail detail = appointment.getSurgicalDetail();
            if (detail == null) {
                throw new IllegalStateException("La cita quirúrgica no tiene detalle asociado.");
            }
            detail.setSurgeon(employee);
            surgicalAppointmentDetailRepository.save(detail);
        }

        return AppointmentMapper.toDetail(appointment);
    }

    @Transactional
    public void delete(Long id) {
        Appointment appointment = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada: id=" + id));

        if (appointment.getClinicalDetail() != null) {
            clinicalAppointmentDetailRepository.delete(appointment.getClinicalDetail());
        }
        if (appointment.getGroomingDetail() != null) {
            groomingAppointmentDetailRepository.delete(appointment.getGroomingDetail());
        }
        if (appointment.getSurgicalDetail() != null) {
            SurgicalAppointmentDetail detail = appointment.getSurgicalDetail();
            if (detail.getOrder() != null) {
                SurgicalOrder order = detail.getOrder();
                order.setScheduledDetail(null);
                order.setStatus(SurgicalOrderStatus.PENDING);
                surgicalOrderRepository.save(order);
            }
            surgicalAppointmentDetailRepository.delete(detail);
        }

        appointmentRepository.delete(appointment);
    }

    private Animal getAnimalOrThrow(Long animalId) {
        return animalRepository.findById(animalId)
                .orElseThrow(() -> new IllegalArgumentException("Animal no encontrado: id=" + animalId));
    }

    private Employee getEmployeeOrThrow(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Empleado no encontrado: id=" + employeeId));
    }

    private ClinicalService getClinicalServiceOrThrow(Long serviceId) {
        return clinicalServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Servicio clínico no encontrado: id=" + serviceId));
    }

    private Branch getBranchOrThrow(Long branchId) {
        return branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("Sucursal no encontrada: id=" + branchId));
    }

    private SurgicalOrder getSurgicalOrderOrThrow(Long orderId) {
        return surgicalOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Orden quirúrgica no encontrada: id=" + orderId));
    }

    private OperatingRoom getOperatingRoomOrThrow(Long operatingRoomId) {
        return operatingRoomRepository.findById(operatingRoomId)
                .orElseThrow(() -> new IllegalArgumentException("Quirófano no encontrado: id=" + operatingRoomId));
    }

    // ---- Reglas de agenda -----------------------------------------------------------------------------------

    private static final int DEFAULT_DURATION_MINUTES = 30;
    private static final long PAST_TOLERANCE_MINUTES = 30;
    private static final List<AppointmentStatus> FLOW = List.of(
            AppointmentStatus.REQUESTED, AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED,
            AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED);

    private static boolean isFinal(AppointmentStatus status) {
        return status == AppointmentStatus.COMPLETED || status == AppointmentStatus.CANCELED
                || status == AppointmentStatus.NO_SHOW;
    }

    /**
     * Avance lineal REQUESTED → SCHEDULED → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED. CANCELED y NO_SHOW
     * se pueden aplicar desde cualquier estado no final. Los estados finales no se reabren ni se retrocede.
     */
    private void validateStatusChange(AppointmentStatus current, AppointmentStatus target) {
        if (current == target) {
            return;
        }
        if (isFinal(current)) {
            throw new IllegalStateException("La cita ya está " + current.name().toLowerCase() + " y no puede cambiar de estado");
        }
        if (target == AppointmentStatus.CANCELED || target == AppointmentStatus.NO_SHOW) {
            return;
        }
        if (FLOW.indexOf(target) < FLOW.indexOf(current)) {
            throw new IllegalStateException("No se puede retroceder una cita de " + current + " a " + target);
        }
    }

    /**
     * Rechaza fechas pasadas (con tolerancia) y cruces de horario del profesional, del paciente y del quirófano.
     * Dos citas se cruzan si start1 < end2 y start2 < end1 (la duración por defecto es de 30 min).
     */
    private void assertSchedulable(LocalDateTime start, Integer durationMinutes, Employee employee, Animal animal,
                                   OperatingRoom room, Long excludeAppointmentId) {
        if (start == null) {
            throw new IllegalArgumentException("La fecha y hora de la cita es obligatoria");
        }
        if (start.isBefore(LocalDateTime.now().minusMinutes(PAST_TOLERANCE_MINUTES))) {
            throw new IllegalArgumentException("No se puede agendar una cita en una fecha/hora pasada");
        }
        LocalDateTime end = start.plusMinutes(durationMinutes != null ? durationMinutes : DEFAULT_DURATION_MINUTES);

        List<Appointment> candidates = appointmentRepository.findActiveCandidates(
                employee != null ? employee.getId() : null,
                animal != null ? animal.getId() : null,
                room != null ? room.getId() : null,
                start.minusHours(12), end);

        for (Appointment other : candidates) {
            if (excludeAppointmentId != null && excludeAppointmentId.equals(other.getId())) {
                continue;
            }
            LocalDateTime otherEnd = other.getStartDateTime().plusMinutes(
                    other.getEstimatedDurationMinutes() != null ? other.getEstimatedDurationMinutes() : DEFAULT_DURATION_MINUTES);
            boolean overlaps = start.isBefore(otherEnd) && other.getStartDateTime().isBefore(end);
            if (!overlaps) {
                continue;
            }
            if (employee != null && other.getAssignedEmployee() != null
                    && employee.getId().equals(other.getAssignedEmployee().getId())) {
                throw new IllegalStateException("El profesional ya tiene una cita en ese horario ("
                        + other.getStartDateTime().toLocalTime() + " - " + otherEnd.toLocalTime() + ")");
            }
            if (animal != null && animal.getId().equals(other.getAnimal().getId())) {
                throw new IllegalStateException("El paciente ya tiene una cita en ese horario");
            }
            if (room != null && other.getSurgicalDetail() != null && other.getSurgicalDetail().getOperatingRoom() != null
                    && room.getId().equals(other.getSurgicalDetail().getOperatingRoom().getId())) {
                throw new IllegalStateException("El quirófano ya está reservado en ese horario");
            }
        }
    }
}
