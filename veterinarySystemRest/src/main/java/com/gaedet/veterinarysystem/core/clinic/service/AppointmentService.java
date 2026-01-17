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

        appointment.setStatus(request.getStatus());
        return AppointmentMapper.toDetail(appointment);
    }

    @Transactional
    public AppointmentDetailResponse assignEmployee(Long id, AssignAppointmentEmployeeRequest request) {
        Appointment appointment = appointmentRepository.findWithDetailsById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cita no encontrada: id=" + id));

        Employee employee = getEmployeeOrThrow(request.getEmployeeId());
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
}
