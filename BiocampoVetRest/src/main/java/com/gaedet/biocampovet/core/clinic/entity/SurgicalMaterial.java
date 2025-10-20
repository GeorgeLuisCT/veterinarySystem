package com.gaedet.biocampovet.core.clinic.entity;

import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;
import javax.persistence.*;
import javax.validation.constraints.AssertTrue;

/**
 * Modela un material o producto utilizado durante la cirugía (gasas, suturas, etc.).
 * Permite registrar tanto productos del inventario como ítems no catalogados (XOR).
 */
@Entity
@Table(name = "surgical_materials")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SurgicalMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "surgical_report_id", nullable = false)
    private SurgicalReport surgicalReport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(length = 255)
    private String unregisteredProductName;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_type", length = 24, nullable = false)
    private ProductUnitType unitType;

    @AssertTrue(message = "Debe especificarse un producto registrado o un nombre de producto no registrado, pero no ambos.")
    public boolean isMaterialSourceValid() {
        return (product != null) ^ (unregisteredProductName != null);
    }
}