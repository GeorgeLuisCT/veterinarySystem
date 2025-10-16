package com.gaedet.biocampovet.core.branches.entity;

import lombok.*;

import javax.persistence.*;

@Entity
@Table(name = "laboratories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Laboratory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(length = 120)
    private String contactName;

    @Column(length = 120)
    private String contactPhone;

    @Column(length = 120)
    private String contactEmail;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
