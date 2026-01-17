package com.gaedet.veterinarysystem.core.inventory.entity;

import com.gaedet.veterinarysystem.core.inventory.enums.AdministrationRoute;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductPresentationType;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.*;

import javax.persistence.*;
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

    @ManyToOne(fetch = FetchType.LAZY)
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
    private Double contentTotal;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "product_administration_routes",
            joinColumns = @JoinColumn(name = "product_id",
                    foreignKey = @ForeignKey(name = "fk_prod_adminroute_product"))
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "route", nullable = false, length = 20)
    @Builder.Default
    private Set<AdministrationRoute> administrationRoutes = new HashSet<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ProductSaleMode> saleModes = new HashSet<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ProductBranch> branchStocks = new HashSet<>();
}


