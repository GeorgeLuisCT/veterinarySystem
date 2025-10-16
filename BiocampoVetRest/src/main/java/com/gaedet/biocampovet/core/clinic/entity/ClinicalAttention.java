package com.gaedet.biocampovet.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.clinic.enums.ClinicalAttentionStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Registro central de una visita clínica, usando el formato SOAP.
 * Se crea cuando un paciente es atendido desde la sala de espera o una cita.
 */
@Entity
@Table(name = "clinical_attention")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicalAttention {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attention_id", unique = true, nullable = false)
    private Attentions attention;

    @Column(nullable = false)
    private LocalDateTime visitDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 24, nullable = false)
    @Builder.Default
    private ClinicalAttentionStatus status = ClinicalAttentionStatus.OPEN;

    @Column(columnDefinition = "TEXT")
    private String subjective;

    @Column(columnDefinition = "TEXT")
    private String objective;

    @Column(columnDefinition = "TEXT")
    private String assessment;

    @Column(columnDefinition = "TEXT")
    private String plan;

    private Double weightKg;
    private Double temperatureCelsius;
    private Integer heartRate;
    private Integer respiratoryRate;

    @OneToMany(mappedBy = "clinicalAttention", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<MedicationAdministration> medicationAdministrations = new HashSet<>();

    @OneToMany(mappedBy = "clinicalAttention", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ClinicalServiceItem> serviceItems = new HashSet<>();

    @OneToMany(mappedBy = "clinicalAttention", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<SurgicalOrder> surgicalOrders = new HashSet<>();

    @OneToMany(mappedBy = "clinicalAttention", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<LaboratoryRequest> laboratoryRequests = new HashSet<>();
}
