package com.gaedet.veterinarysystem.core.clinic.entity;

import javax.persistence.*;
import javax.validation.constraints.AssertTrue;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionType;
import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionsStatus;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Modela el estado de un paciente cuando llega a la veterinaria en tiempo real.
 */
@Entity
@Table(
        name = "attentions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_attentions_appointment", columnNames = "appointment_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attentions {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attending_employee_id", nullable = false)
    private Employee attendingEmployee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "surgical_order_id")
    private SurgicalOrder surgicalOrder;

    @Column(nullable = false)
    private LocalDateTime checkInTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 32)
    private AttentionType type;

    @Column(nullable = false)
    @Builder.Default
    private boolean isEmergency = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttentionsStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinical_service_id")
    private ClinicalService service;


    @AssertTrue(message = "Si la atención es quirúrgica y hay servicio, este debe ser de categoría SURGERY")
    public boolean serviceMustBeSurgicalWhenSurgeryAttention() {
        if (type != AttentionType.SURGERY || service == null) return true;
        return service.getClinicalServiceCategory() == ClinicalServiceCategory.SURGERY;
    }

    @AssertTrue(message = "Si hay orden, el animal de la orden debe coincidir con el de la atención")
    public boolean orderAnimalConsistency() {
        if (surgicalOrder == null) return true;
        Long a1 = animal != null ? animal.getId() : null;
        Long a2 = surgicalOrder.getAnimal() != null ? surgicalOrder.getAnimal().getId() : null;
        return Objects.equals(a1, a2);
    }

    @AssertTrue(message = "Si hay cita y orden, el animal de la orden debe coincidir con el de la cita")
    public boolean orderAppointmentAnimalConsistency() {
        if (surgicalOrder == null || appointment == null) return true;
        Long a1 = appointment.getAnimal() != null ? appointment.getAnimal().getId() : null;
        Long a2 = surgicalOrder.getAnimal() != null ? surgicalOrder.getAnimal().getId() : null;
        return Objects.equals(a1, a2);
    }
}