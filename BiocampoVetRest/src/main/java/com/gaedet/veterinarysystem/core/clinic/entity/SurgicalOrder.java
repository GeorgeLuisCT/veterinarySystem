package com.gaedet.veterinarysystem.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.branches.entity.OperatingRoom;
import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalOrderStatus;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Representa una cirugía recomendada que está pendiente de ser agendada o atentida.
 */
@Entity
@Table(name = "surgical_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SurgicalOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recommended_service_id", nullable = false)
    private ClinicalService recommendedService;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private Employee requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SurgicalOrderStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "order")
    private SurgicalAppointmentDetail scheduledDetail;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "clinical_attention_id", nullable = true)
    private ClinicalAttention clinicalAttention;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "operating_room_id")
    private OperatingRoom operatingRoom;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = SurgicalOrderStatus.PENDING;
    }

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
