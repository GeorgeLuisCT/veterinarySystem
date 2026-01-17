package com.gaedet.veterinarysystem.core.clinic.entity;

import com.gaedet.veterinarysystem.core.branches.entity.OperatingRoom;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;

@Entity
@Table(
        name = "surgical_appointment_details",
        uniqueConstraints = @UniqueConstraint(name = "uk_surgical_detail_order", columnNames = "order_id")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurgicalAppointmentDetail {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY) @MapsId
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "order_id")
    private SurgicalOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "final_service_id", nullable = false)
    private ClinicalService finalService;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "surgeon_id", nullable = false)
    private Employee surgeon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anesthetist_id")
    private Employee anesthetist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operating_room_id")
    private OperatingRoom operatingRoom;

    @Column(columnDefinition = "TEXT")
    private String prepInstructions;
}
