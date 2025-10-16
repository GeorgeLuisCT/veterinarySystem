package com.gaedet.biocampovet.core.clinic.entity;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import lombok.*;
import javax.persistence.*;


@Entity
@Table(name = "clinical_appointment_details")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ClinicalAppointmentDetail {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY) @MapsId
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "clinical_service_id", nullable = false)
    private ClinicalService clinicalService;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "veterinarian_id", nullable = false)
    private Employee veterinarian;

    @Column(columnDefinition = "TEXT")
    private String consultationReason;

    @Column(columnDefinition = "TEXT")
    private String clinicalNotes;
}
