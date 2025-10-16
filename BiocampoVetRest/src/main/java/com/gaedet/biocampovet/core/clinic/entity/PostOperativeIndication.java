package com.gaedet.biocampovet.core.clinic.entity;

import com.gaedet.biocampovet.core.clinic.enums.FrequencyUnit;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;
import javax.persistence.*;
import javax.validation.constraints.AssertTrue;
import java.math.BigDecimal;

/**
 * Representa una indicación post-operatoria.
 * Puede ser un fármaco a administrar (vinculado a un Producto) o una
 * instrucción de cuidado no farmacológica.
 */
@Entity
@Table(name = "post_operative_indications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PostOperativeIndication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "surgical_report_id", nullable = false)
    private SurgicalReport surgicalReport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(columnDefinition = "TEXT")
    private String nonDrugInstruction;

    @Column(precision = 10, scale = 4)
    private BigDecimal doseAmount;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private ProductUnitType doseUnit;

    @Column(name = "frequency_value")
    private Integer frequencyValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency_unit", length = 20)
    private FrequencyUnit frequencyUnit;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    private AdministrationRoute route;

    @AssertTrue(message = "Debe especificarse un producto o una instrucción no farmacológica, pero no ambos.")
    public boolean isIndicationValid() {
        boolean productSpecified = (product != null && doseAmount != null && doseUnit != null);
        boolean instructionSpecified = (nonDrugInstruction != null && !nonDrugInstruction.trim().isEmpty());

        return (productSpecified && !instructionSpecified) || (!productSpecified && instructionSpecified);
    }
}