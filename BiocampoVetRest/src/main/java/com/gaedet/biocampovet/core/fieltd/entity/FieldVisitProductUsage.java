package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;


/**
 * Consumo de insumos (descuenta del inventario móvil).
 * Crea también un ProductStockMovement CONSUMPTION enlazado a esta visita.
 */
@Entity @Table(name="field_visit_product_usage")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FieldVisitProductUsage {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="field_visit_id", nullable=false)
    private FieldVisit fieldVisit;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="product_id", nullable=false)
    private Product product;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private ProductUnitType unit;

    @Column(nullable=false) private Integer quantityUsed;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="vehicle_id")
    private Vehicle sourceVehicle; // desde dónde salió el insumo

    @Column(columnDefinition="TEXT") private String notes;
}
