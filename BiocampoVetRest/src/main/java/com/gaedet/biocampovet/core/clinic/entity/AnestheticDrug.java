package com.gaedet.biocampovet.core.clinic.entity;

import com.gaedet.biocampovet.core.clinic.enums.AnestheticPhase;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;
import javax.persistence.*;
import java.math.BigDecimal;

/**
 * Modela la administración de un fármaco específico como parte del protocolo anestésico.
 * Cada registro aquí está pensado para descontarse del inventario.
 */
@Entity
@Table(name = "anesthetic_drugs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AnestheticDrug {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "surgical_report_id", nullable = false)
    private SurgicalReport surgicalReport;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(length = 32, nullable = false)
    private AnestheticPhase phase;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal doseAmount;

    @Enumerated(EnumType.STRING)
    @Column(length = 24, nullable = false)
    private ProductUnitType doseUnit;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private AdministrationRoute route;
}