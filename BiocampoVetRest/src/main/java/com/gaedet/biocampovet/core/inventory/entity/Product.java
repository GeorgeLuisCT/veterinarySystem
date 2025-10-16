package com.gaedet.biocampovet.core.inventory.entity;

import com.gaedet.biocampovet.core.inventory.enums.ProductPresentationType;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "products")
@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Integer minStock;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private CategoryProduct category;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductPresentationType presentation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductUnitType unitType;

    @Column(nullable = false)
    private BigDecimal standardPrice;

    @Column(nullable = false)
    private Double contentTotal;

    //agregar via de aplicacion pueder varias vias de aplicacion

    //agregar tipo de venta

    /*public enum ProductType {
    VENTA,       // Productos que se venden
    USO_INTERNO, // Materiales usados en procedimientos
    SERVICIO     // Procedimientos o atenciones clínicas
}
    * */

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ProductSaleMode> saleModes = new HashSet<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ProductBranchStock> branchStocks = new HashSet<>();
}


