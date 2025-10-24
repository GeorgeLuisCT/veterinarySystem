package com.gaedet.biocampovet.core.fieltd.entity;

import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "field_visit_service_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitServiceProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_item_id", nullable = false)
    private FieldVisitServiceItem serviceItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(precision = 12, scale = 3)
    private BigDecimal dose;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", length = 32, nullable = false)
    private ProductUnitType unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "administration_route", length = 32, nullable = false)
    private AdministrationRoute administrationRoute;
}
