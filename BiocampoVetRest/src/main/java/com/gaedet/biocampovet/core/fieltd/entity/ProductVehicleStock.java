package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;

/**
 * Gestiona la cantidad de stock de un producto específico
 * en un vehículo de campo.
 */
@Entity @Table(name="product_vehicle_stock",
        uniqueConstraints=@UniqueConstraint(columnNames={"vehicle_id","product_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductVehicleStock {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="vehicle_id", nullable=false)
    private Vehicle vehicle;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="product_id", nullable=false)
    private Product product;

    @Enumerated(EnumType.STRING) @Column(nullable=false, length = 20)
    @Builder.Default
    private ProductUnitType unit = ProductUnitType.UNIT;

    @Column(nullable=false) @Builder.Default private Integer quantity = 0;
}
