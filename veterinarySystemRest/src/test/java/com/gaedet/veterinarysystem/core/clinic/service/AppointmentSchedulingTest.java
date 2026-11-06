package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.animal.repository.AnimalRepository;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.branches.repository.BranchRepository;
import com.gaedet.veterinarysystem.core.branches.repository.OperatingRoomRepository;
import com.gaedet.veterinarysystem.core.clinic.dto.CreateClinicalAppointmentRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.UpdateAppointmentStatusRequest;
import com.gaedet.veterinarysystem.core.clinic.entity.Appointment;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalService;
import com.gaedet.veterinarysystem.core.clinic.enums.AppointmentStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.AppointmentType;
import com.gaedet.veterinarysystem.core.clinic.repository.*;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentSchedulingTest {

    @Mock AppointmentRepository appointmentRepository;
    @Mock ClinicalAppointmentDetailRepository clinicalAppointmentDetailRepository;
    @Mock GroomingAppointmentDetailRepository groomingAppointmentDetailRepository;
    @Mock SurgicalAppointmentDetailRepository surgicalAppointmentDetailRepository;
    @Mock SurgicalOrderRepository surgicalOrderRepository;
    @Mock ClinicalServiceRepository clinicalServiceRepository;
    @Mock AnimalRepository animalRepository;
    @Mock EmployeeRepository employeeRepository;
    @Mock BranchRepository branchRepository;
    @Mock OperatingRoomRepository operatingRoomRepository;

    @InjectMocks AppointmentService service;

    private Employee vet;
    private Animal animal;

    @BeforeEach
    void setUp() {
        vet = new Employee();
        vet.setId(4L);
        animal = new Animal();
        animal.setId(9L);
        Branch branch = new Branch();
        branch.setId(1L);
        lenient().when(animalRepository.findById(9L)).thenReturn(Optional.of(animal));
        lenient().when(employeeRepository.findById(4L)).thenReturn(Optional.of(vet));
        lenient().when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));
        lenient().when(clinicalServiceRepository.findById(2L)).thenReturn(Optional.of(new ClinicalService()));
    }

    private CreateClinicalAppointmentRequest request(LocalDateTime start, Integer minutes) {
        CreateClinicalAppointmentRequest r = new CreateClinicalAppointmentRequest();
        r.setAnimalId(9L);
        r.setBranchId(1L);
        r.setClinicalServiceId(2L);
        r.setVeterinarianId(4L);
        r.setStartDateTime(start);
        r.setEstimatedDurationMinutes(minutes);
        return r;
    }

    private Appointment existing(LocalDateTime start, int minutes) {
        return Appointment.builder().id(70L).animal(new Animal()).assignedEmployee(vet)
                .startDateTime(start).estimatedDurationMinutes(minutes)
                .type(AppointmentType.CLINIC).status(AppointmentStatus.SCHEDULED).build();
    }

    @Test
    void professionalCannotBeDoubleBooked() {
        LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);
        when(appointmentRepository.findActiveCandidates(anyLong(), anyLong(), any(), any(), any()))
                .thenReturn(List.of(existing(start.minusMinutes(15), 30))); // 9:45-10:15 cruza con 10:00-10:30

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.createClinicalAppointment(request(start, 30)));

        assertTrue(ex.getMessage().contains("profesional ya tiene una cita"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    void backToBackAppointmentsAreAllowed() {
        LocalDateTime start = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);
        // Termina exactamente cuando empieza la nueva: no hay cruce
        when(appointmentRepository.findActiveCandidates(anyLong(), anyLong(), any(), any(), any()))
                .thenReturn(List.of(existing(start.minusMinutes(30), 30)));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> {
            Appointment a = i.getArgument(0);
            throw new StopHere();
        });

        // Si llegó a guardar, pasó la validación de cruces
        assertThrows(StopHere.class, () -> service.createClinicalAppointment(request(start, 30)));
    }

    static class StopHere extends RuntimeException { }

    @Test
    void pastAppointmentsAreRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> service.createClinicalAppointment(request(LocalDateTime.now().minusHours(3), 30)));
    }

    @Test
    void completedAppointmentCannotBeReopened() {
        Appointment done = existing(LocalDateTime.now().plusDays(1), 30);
        done.setStatus(AppointmentStatus.COMPLETED);
        when(appointmentRepository.findWithDetailsById(70L)).thenReturn(Optional.of(done));
        UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest();
        req.setStatus(AppointmentStatus.SCHEDULED);

        assertThrows(IllegalStateException.class, () -> service.updateStatus(70L, req));
    }

    @Test
    void statusCannotGoBackwards() {
        Appointment inProgress = existing(LocalDateTime.now().plusDays(1), 30);
        inProgress.setStatus(AppointmentStatus.IN_PROGRESS);
        when(appointmentRepository.findWithDetailsById(70L)).thenReturn(Optional.of(inProgress));
        UpdateAppointmentStatusRequest req = new UpdateAppointmentStatusRequest();
        req.setStatus(AppointmentStatus.CONFIRMED);

        assertThrows(IllegalStateException.class, () -> service.updateStatus(70L, req));
    }
}
