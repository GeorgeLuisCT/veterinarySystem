package com.gaedet.veterinarysystem.core.clinic.entity;

import com.gaedet.veterinarysystem.core.inventory.entity.Product;
import com.gaedet.veterinarysystem.core.inventory.enums.AdministrationRoute;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import javax.persistence.*;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "clinical_service_product")
@Builder
public class ClinicalServiceProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "clinical_service_item_id")
    private ClinicalServiceItem clinicalServiceItem;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "dose")
    private BigDecimal dose;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit")
    private ProductUnitType unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "administration_route")
    private AdministrationRoute administrationRoute;
}
