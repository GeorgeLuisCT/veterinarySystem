package com.gaedet.veterinarysystem.core.fieltd.entity;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import lombok.*;

import javax.persistence.*;

@Entity
@Table(name = "field_visit_service_animals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitServiceAnimal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_item_id", nullable = false)
    private FieldVisitServiceItem serviceItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;
}
