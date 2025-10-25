package com.gaedet.biocampovet.core.inventory.entity;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(
        name = "product_sale_mode",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"product_id", "unit_type"})
        }
)
@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
@Builder
public class ProductSaleMode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_type", nullable = false, length = 20)
    private ProductUnitType unitType;

    @Column(nullable = false)
    private Double quantityEquivalent;

    @Column(nullable = false)
    private BigDecimal price;
}