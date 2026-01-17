package com.gaedet.veterinarysystem.core.clinic.entity;

import com.gaedet.veterinarysystem.core.branches.entity.OperatingRoom;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionType;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalReportStatus;
import lombok.*;
import javax.persistence.*;
import javax.validation.constraints.AssertTrue;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Informe detallado de un procedimiento quirúrgico.
 * Contiene referencias a los fármacos, materiales e indicaciones de forma estructurada.
 */
@Entity
@Table(name = "surgical_reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SurgicalReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attention_id", nullable = false, unique = true)
    private Attentions attention;

    @Enumerated(EnumType.STRING)
    @Column(length = 24, nullable = false)
    @Builder.Default
    private SurgicalReportStatus status = SurgicalReportStatus.DRAFT;

    @Column(name = "surgery_start_at", nullable = true)
    private LocalDateTime surgeryStartAt;

    @Column(name = "surgery_end_at", nullable = true)
    private LocalDateTime surgeryEndAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surgeon_id")
    private Employee surgeon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anesthesiologist_id")
    private Employee anesthesiologist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operating_room_id")
    private OperatingRoom operatingRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assistant_id")
    private Employee assistant;

    @Column(columnDefinition = "TEXT")
    private String monitoring;

    @Column(columnDefinition = "TEXT")
    private String findings;

    @Column(columnDefinition = "TEXT")
    private String surgicalTechniqueDescription;


    @OneToMany(mappedBy = "surgicalReport", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<AnestheticDrug> anestheticProtocol = new HashSet<>();

    @OneToMany(mappedBy = "surgicalReport", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<SurgicalMaterial> materialsUsed = new HashSet<>();

    @OneToMany(mappedBy = "surgicalReport", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<PostOperativeIndication> postOperativeIndications = new HashSet<>();

    @AssertTrue(message = "El reporte quirúrgico solo aplica a atenciones de tipo SURGERY")
    public boolean attentionMustBeSurgical() {
        return attention == null || attention.getType() == AttentionType.SURGERY;
    }
}
