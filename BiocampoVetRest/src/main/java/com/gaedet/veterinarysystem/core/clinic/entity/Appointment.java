package com.gaedet.veterinarysystem.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.clinic.enums.AppointmentStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.AppointmentType;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Representa una cita agendada en el calendario.
 */
@Entity
@Table(name = "appointments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee assignedEmployee;

    @Column(nullable = false)
    private LocalDateTime startDateTime;

    @Column(name = "estimated_duration_minutes")
    private Integer estimatedDurationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AppointmentType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AppointmentStatus status;

    @Column(name = "requester_name", length = 160)
    private String requesterName;

    @Column(name = "requester_email", length = 160)
    private String requesterEmail;

    @Column(name = "requester_phone", length = 64)
    private String requesterPhone;

    @Column(name = "request_notes", columnDefinition = "TEXT")
    private String requestNotes;

    @OneToOne(mappedBy = "appointment", fetch = FetchType.LAZY)
    private ClinicalAppointmentDetail clinicalDetail;

    @OneToOne(mappedBy = "appointment", fetch = FetchType.LAZY)
    private GroomingAppointmentDetail groomingDetail;

    @OneToOne(mappedBy = "appointment", fetch = FetchType.LAZY)
    private SurgicalAppointmentDetail surgicalDetail;
}
