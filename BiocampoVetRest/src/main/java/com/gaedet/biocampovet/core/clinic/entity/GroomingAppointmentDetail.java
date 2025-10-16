package com.gaedet.biocampovet.core.clinic.entity;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import lombok.*;
import javax.persistence.*;

@Entity
@Table(name = "grooming_appointment_details")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GroomingAppointmentDetail {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY) @MapsId
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clinical_service_id", nullable = false)
    private ClinicalService clinicalService;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stylist_id", nullable = false)
    private Employee stylist;

    @Column(columnDefinition = "TEXT")
    private String ownerSpecialNotes;
}
