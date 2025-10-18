package com.gaedet.biocampovet.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.clinic.enums.GroomingStatus;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Seguimiento de una sesión de peluquería con tiempos, responsable,
 * productos/insumos utilizados y precio cobrado.
 */
@Entity
@Table(
        name = "grooming_sessions",
        indexes = {
                @Index(name = "idx_grooming_status_start", columnList = "status, started_at")
        }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GroomingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attention_id", nullable = false, unique = true)
    private Attentions attention;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private GroomingStatus status;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_professional_id")
    private Employee assignedProfessional;

    @Column(name = "charged_price", precision = 12, scale = 2)
    private BigDecimal chargedPrice;

    @Column(columnDefinition = "TEXT")
    private String behaviorNotes;

    @Column(columnDefinition = "TEXT")
    private String clinicalObservations;

    @ElementCollection
    @CollectionTable(name = "grooming_photos", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "photo_url", length = 512)
    private List<String> photoUrls;

    @OneToMany(mappedBy = "groomingSession", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<GroomingMaterialUsed> materialsUsed = new HashSet<>();

}
