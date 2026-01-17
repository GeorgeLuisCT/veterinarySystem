package com.gaedet.veterinarysystem.core.clinic.entity;

import com.gaedet.veterinarysystem.core.clinic.enums.LabRequestItemStatus;
import lombok.*;
import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "laboratory_request_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaboratoryRequestItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "laboratory_request_id", nullable = false)
    private LaboratoryRequest laboratoryRequest;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private LaboratoryTest test;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LabRequestItemStatus status;


    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private LocalDateTime reportedAt;
    private LocalDateTime verifiedAt;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @OneToMany(mappedBy = "requestItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<LaboratoryResultValue> results = new HashSet<>();

}
