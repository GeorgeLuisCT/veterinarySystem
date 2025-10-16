package com.gaedet.biocampovet.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Define una tarea programada en la hoja de tratamiento de un paciente hospitalizado.
 */
@Entity
@Table(name = "treatment_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TreatmentSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospitalization_id", nullable = false)
    private Hospitalization hospitalization;

    @Column(nullable = false)
    private String treatmentName;

    @Column(nullable = false)
    private LocalDateTime scheduledTime;

    private boolean isCompleted;

    private LocalDateTime completedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_employee_id")
    private Employee completedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;
}