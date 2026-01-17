package com.gaedet.veterinarysystem.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.fieltd.enums.FieldVisitStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Visita planificada/ejecutada. Es la unidad que aparece en calendario,
 * hoja de ruta y centro de control.
 */
@Entity @Table(name="field_visits",
        indexes = {
                @Index(columnList="scheduledDateTime"),
                @Index(columnList="status"),
                @Index(columnList="field_vet_employee_id")
        })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FieldVisit {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="farm_id")
    private Farm farm;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="zone_id")
    private GeoZone zone;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="field_vet_employee_id", nullable=false)
    private Employee fieldVet;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="vehicle_id")
    private Vehicle vehicle; // vehículo usado en la jornada

    @Column(nullable=false) private LocalDateTime scheduledDateTime;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;

    @Column(columnDefinition="TEXT") private String objective;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private FieldVisitStatus status;

    // Para hoja de ruta (si no usas FieldRouteDay)
    private Integer routeOrder;

    // Resumen final (card derecha “Últimos Reportes”)
    @Column(columnDefinition="TEXT") private String reportSummary;

    @OneToMany(mappedBy="fieldVisit", cascade=CascadeType.ALL, orphanRemoval=true)
    @Builder.Default private Set<FieldVisitServiceItem> serviceItems = new HashSet<>();

    @OneToMany(mappedBy="fieldVisit", cascade=CascadeType.ALL, orphanRemoval=true)
    @Builder.Default private Set<FieldVisitProductUsage> productUsages = new HashSet<>();

    @OneToMany(mappedBy="fieldVisit", cascade=CascadeType.ALL, orphanRemoval=true)
    @Builder.Default private Set<FieldVisitCompanion> companions = new HashSet<>();

    @OneToOne(mappedBy="fieldVisit", cascade=CascadeType.ALL, orphanRemoval=true)
    private FieldVisitBiosecurity biosecurity;

    @OneToOne(mappedBy = "fieldVisit", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private FieldVisitReport report;

    @OneToMany(mappedBy="fieldVisit", cascade=CascadeType.ALL, orphanRemoval=true)
    @Builder.Default private Set<FieldVisitAttachment> attachments = new HashSet<>();

    public void setReport(FieldVisitReport report) {
        this.report = report;
        if (report != null) {
            report.setFieldVisit(this);
        }
    }
}
