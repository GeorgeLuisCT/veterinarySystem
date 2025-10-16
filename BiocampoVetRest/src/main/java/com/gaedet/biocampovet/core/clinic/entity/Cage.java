package com.gaedet.biocampovet.core.clinic.entity;

import javax.persistence.*;
import lombok.*;

/**
 * Define una jaula física en el área de hospitalización.
 */
@Entity
@Table(name = "cages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String size;

    @Column(name = "is_occupied")
    private boolean isOccupied;
}