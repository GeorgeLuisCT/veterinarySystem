package com.gaedet.biocampovet.core.animal.entity;

import lombok.*;

import javax.persistence.*;

@Entity
@Table(name = "animal_specie")
@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
@Builder
public class AnimalSpecies {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;
}