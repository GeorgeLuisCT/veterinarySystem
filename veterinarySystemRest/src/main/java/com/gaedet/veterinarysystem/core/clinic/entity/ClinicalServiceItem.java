package com.gaedet.veterinarysystem.core.clinic.entity;

import lombok.*;
import javax.persistence.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "clinical_service_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicalServiceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "clinical_attention_id", nullable = false)
    private ClinicalAttention clinicalAttention;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "clinical_service_id", nullable = false)
    private ClinicalService clinicalService;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(precision = 14, scale = 2, nullable = false)
    private BigDecimal subtotal;

    /** Detalle de venta (sale_details.id) con el que se cobró este ítem; null = pendiente de cobro. */
    @Column(name = "sale_detail_id")
    private Long saleDetailId;


    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "clinicalServiceItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ClinicalServiceProduct> products = new HashSet<>();;
}
