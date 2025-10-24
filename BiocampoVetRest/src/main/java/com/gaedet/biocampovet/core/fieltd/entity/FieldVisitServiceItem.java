package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.clinic.entity.ClinicalService;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

import lombok.*;

/**
 * Servicios realizados en la visita (reutiliza tu catálogo ClinicalService).
 */
@Entity @Table(name="field_visit_service_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FieldVisitServiceItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="field_visit_id", nullable=false)
    private FieldVisit fieldVisit;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="clinical_service_id", nullable=false)
    private ClinicalService clinicalService;

    @Column(nullable=false) @Builder.Default private Integer quantity = 1;

    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal unitPrice; // snapshot precio del día

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="performed_by")
    private Employee performedBy;

    @Column(columnDefinition="TEXT") private String notes;

    @OneToMany(mappedBy = "serviceItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<FieldVisitServiceAnimal> animals = new HashSet<>();

    @OneToMany(mappedBy = "serviceItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<FieldVisitServiceGroup> groups = new HashSet<>();

    @OneToMany(mappedBy = "serviceItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<FieldVisitServiceProduct> products = new HashSet<>();

    public void setAnimals(Set<FieldVisitServiceAnimal> animals) {
        this.animals = animals;
        if (animals != null) {
            animals.forEach(animal -> animal.setServiceItem(this));
        }
    }

    public void setGroups(Set<FieldVisitServiceGroup> groups) {
        this.groups = groups;
        if (groups != null) {
            groups.forEach(group -> group.setServiceItem(this));
        }
    }

    public void setProducts(Set<FieldVisitServiceProduct> products) {
        this.products = products;
        if (products != null) {
            products.forEach(product -> product.setServiceItem(this));
        }
    }
}
