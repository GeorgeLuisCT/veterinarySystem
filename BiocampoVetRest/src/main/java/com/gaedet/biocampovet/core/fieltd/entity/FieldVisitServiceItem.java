package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.clinic.entity.ClinicalService;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import lombok.*;

import java.math.BigDecimal;

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
}
