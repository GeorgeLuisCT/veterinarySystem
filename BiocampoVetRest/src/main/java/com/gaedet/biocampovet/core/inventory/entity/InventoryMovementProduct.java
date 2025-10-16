package com.gaedet.biocampovet.core.inventory.entity;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "inventory_movement_product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovementProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "movement_id")
    private InventoryMovement movement;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductUnitType unitType;

    @Column(nullable = false)
    private Double quantity;

    private BigDecimal unitCost;

    @ManyToOne
    @JoinColumn(name = "product_batch_id")
    private ProductBatch productBatch;
}

