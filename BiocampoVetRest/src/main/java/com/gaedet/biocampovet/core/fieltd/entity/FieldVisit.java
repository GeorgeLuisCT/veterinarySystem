package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.fieltd.enums.FieldVisitStatus;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Representa una visita de un veterinario a una granja.
 */
@Entity
@Table(name = "field_visits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FieldVisit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_vet_employee_id", nullable = false)
    private Employee fieldVet;

    @Column(nullable = false)
    private LocalDateTime scheduledDateTime;

    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;

    @Column(columnDefinition = "TEXT")
    private String objective;

    @Column(columnDefinition = "TEXT")
    private String reportSummary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FieldVisitStatus status;
}