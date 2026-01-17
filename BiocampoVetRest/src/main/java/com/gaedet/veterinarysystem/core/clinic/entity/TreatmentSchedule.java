package com.gaedet.veterinarysystem.core.clinic.entity;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;

import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Define una tarea programada en la hoja de tratamiento de un paciente
 * hospitalizado.
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

    @OneToMany(mappedBy = "treatmentSchedule", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TreatmentScheduleProductUsage> productUsages = new ArrayList<>();
}
