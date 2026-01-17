package com.gaedet.veterinarysystem.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import lombok.*;

@Entity
@Table(name = "field_visit_companions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"field_visit_id", "employee_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitCompanion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_visit_id", nullable = false)
    private FieldVisit fieldVisit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;
}
