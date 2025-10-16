package com.gaedet.biocampovet.core.branches.entity;

import javax.persistence.*;
import lombok.*;


/**
 * Quirófano / sala de cirugía perteneciente a una sucursal.
 */
@Entity
@Table(name = "operating_rooms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OperatingRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
