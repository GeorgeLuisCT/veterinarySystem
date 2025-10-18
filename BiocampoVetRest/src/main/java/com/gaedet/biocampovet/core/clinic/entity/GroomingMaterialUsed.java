package com.gaedet.biocampovet.core.clinic.entity;

import javax.persistence.*;
import javax.validation.constraints.AssertTrue;

import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;

import java.math.BigDecimal;

/**
 * Insumo o producto utilizado durante la sesión de peluquería.
 * Acepta producto del catálogo o ítem no registrado (XOR).
 */
@Entity
@Table(name = "grooming_materials_used")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GroomingMaterialUsed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grooming_session_id", nullable = false)
    private GroomingSession groomingSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "unregistered_product_name", length = 255)
    private String unregisteredProductName;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_type", length = 24, nullable = false)
    private ProductUnitType unitType;

    @Column(name = "unit_price", precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "subtotal", precision = 12, scale = 2)
    private BigDecimal subtotal;

    @AssertTrue(message = "Debe especificarse un producto o un nombre no registrado, pero no ambos.")
    public boolean isSourceValid() {
        return (product != null) ^ (unregisteredProductName != null);
    }
}
