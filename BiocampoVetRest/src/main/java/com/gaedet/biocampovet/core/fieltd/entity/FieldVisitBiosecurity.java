package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import lombok.*;

@Entity @Table(name="field_visit_biosecurity")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FieldVisitBiosecurity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="field_visit_id", nullable=false, unique=true)
    private FieldVisit fieldVisit;

    // Checklist simple (ajusta según lo que quieras mostrar)
    @Builder.Default private boolean vehicleAndEquipmentCleaned = false;
    @Builder.Default private boolean ppeUsed = false;
    @Builder.Default private boolean handHygiene = false;
    @Column(columnDefinition="TEXT") private String notes;
}
