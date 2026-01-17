package com.gaedet.veterinarysystem.core.branches.entity;

import com.gaedet.veterinarysystem.core.clinic.entity.BranchClinicalService;
import com.gaedet.veterinarysystem.core.clinic.entity.Cage;
import com.gaedet.veterinarysystem.core.employees.entity.EmployeeBranch;
import com.gaedet.veterinarysystem.core.inventory.entity.ProductBranch;

import lombok.*;

import javax.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "branches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<ProductBranch> productBranchStock;

    @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<EmployeeBranch> employeeBranches = new HashSet<>();

    @OneToMany(mappedBy = "branch", orphanRemoval = true)
    private Set<BranchClinicalService> clinicalServiceLinks = new HashSet<>();

    @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<OperatingRoom> operatingRooms = new HashSet<>();

    @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Cage> cages = new HashSet<>();
}
