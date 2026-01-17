package com.gaedet.veterinarysystem.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.fieltd.enums.StockLocationType;
import com.gaedet.veterinarysystem.core.fieltd.enums.StockMovementType;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Traza TODO movimiento de inventario (carga, devolución, consumo en visita, ajuste).
 * Úsalo para auditoría y para recalcular stock si hiciera falta.
 */
@Entity @Table(name="product_stock_movements",
        indexes={
                @Index(columnList="createdAt"),
                @Index(columnList="movementType"),
                @Index(columnList="product_id"),
                @Index(columnList="vehicle_id"),
                @Index(columnList="branch_id"),
                @Index(columnList="field_visit_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductStockMovement {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private StockMovementType movementType;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="product_id", nullable=false)
    private Product product;

    @Column(nullable=false) private Integer quantityDelta; // + entra / - sale

    // Origen / destino
    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private StockLocationType fromType;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private StockLocationType toType;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="vehicle_id")
    private Vehicle vehicle; // cuando aplica (from o to)

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="branch_id")
    private Branch branch;   // cuando aplica (from o to)

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="field_visit_id")
    private FieldVisit fieldVisit; // para CONSUMPTION

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="created_by")
    private Employee createdBy;

    @Enumerated(EnumType.STRING) @Column(name="unit", length = 20)
    private ProductUnitType unit;

    @Column(nullable=false) @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(columnDefinition="TEXT") private String notes;
}
