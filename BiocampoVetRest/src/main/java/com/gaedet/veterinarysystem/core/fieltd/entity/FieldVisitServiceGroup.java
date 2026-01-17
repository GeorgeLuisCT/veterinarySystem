package com.gaedet.veterinarysystem.core.fieltd.entity;

import com.gaedet.veterinarysystem.core.animal.enums.AnimalSpecies;
import lombok.*;

import javax.persistence.*;

@Entity
@Table(name = "field_visit_service_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitServiceGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_item_id", nullable = false)
    private FieldVisitServiceItem serviceItem;

    @Enumerated(EnumType.STRING)
    @Column(name = "species", length = 32)
    private AnimalSpecies species;

    @Column(name = "breed")
    private String breed;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
