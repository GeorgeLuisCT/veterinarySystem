package com.gaedet.veterinarysystem.core.clinic.entity;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import javax.persistence.*;

import com.gaedet.veterinarysystem.core.clinic.enums.CageSize;
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CageSize size;

    @Column(name = "is_occupied")
    private boolean isOccupied;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;
}