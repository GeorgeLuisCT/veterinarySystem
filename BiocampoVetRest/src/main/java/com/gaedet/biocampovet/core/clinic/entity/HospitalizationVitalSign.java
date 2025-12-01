package com.gaedet.biocampovet.core.clinic.entity;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hospitalization_vital_signs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HospitalizationVitalSign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospitalization_id", nullable = false)
    private Hospitalization hospitalization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by_employee_id", nullable = false)
    private Employee recordedBy;

    @Column(nullable = false)
    private LocalDateTime recordedAt;

    private Double weightKg;
    private Double temperatureCelsius;
    private Integer heartRate;
    private Integer respiratoryRate;
}
