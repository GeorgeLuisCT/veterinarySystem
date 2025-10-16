package com.gaedet.biocampovet.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Nota en la bitácora de evolución de un paciente hospitalizado.
 */
@Entity
@Table(name = "evolution_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EvolutionNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospitalization_id", nullable = false)
    private Hospitalization hospitalization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_employee_id", nullable = false)
    private Employee author;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String note;
}