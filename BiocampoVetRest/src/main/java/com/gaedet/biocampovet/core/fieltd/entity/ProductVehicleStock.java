package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.inventory.entity.Product;
import lombok.*;

/**
 * Gestiona la cantidad de stock de un producto específico
 * en un vehículo de campo.
 */
@Entity
@Table(name = "product_vehicle_stock")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductVehicleStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;
}