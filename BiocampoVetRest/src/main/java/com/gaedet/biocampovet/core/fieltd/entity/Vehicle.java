package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import lombok.*;

/**
 * Representa un vehículo utilizado para las visitas de campo,
 * funcionando como un almacén móvil.
 */
@Entity @Table(name="vehicles",
        uniqueConstraints=@UniqueConstraint(columnNames={"name"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Vehicle {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true) private String name;
    @Column(unique=true) private String licensePlate;

    @OneToOne @JoinColumn(name="assigned_vet_employee_id")
    private Employee assignedVet;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="home_branch_id")
    private Branch homeBranch;

    @Builder.Default private boolean active = true;
}