package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import lombok.*;

/**
 * Representa un vehículo utilizado para las visitas de campo,
 * funcionando como un almacén móvil.
 */
@Entity
@Table(name = "vehicles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // Ej: "Camioneta 1"

    @Column(unique = true)
    private String licensePlate; // Placa

    @OneToOne
    @JoinColumn(name = "assigned_vet_employee_id") // El veterinario usualmente asignado
    private Employee assignedVet;
}