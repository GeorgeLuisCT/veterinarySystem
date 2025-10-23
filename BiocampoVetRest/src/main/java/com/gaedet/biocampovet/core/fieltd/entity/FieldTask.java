package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.fieltd.enums.FieldTaskPriority;
import com.gaedet.biocampovet.core.fieltd.enums.FieldTaskStatus;
import lombok.*;

import java.time.LocalDateTime;

@Entity @Table(name="field_tasks",
        indexes={@Index(columnList="status"), @Index(columnList="priority")})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FieldTask {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @Column(nullable=false) private String title;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="farm_id", nullable=false)
    private Farm farm;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="zone_id")
    private GeoZone zone;

    @Column(columnDefinition="TEXT") private String description;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private FieldTaskPriority priority;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private FieldTaskStatus status;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="assigned_to")
    private Employee assignedTo;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="created_by")
    private Employee createdBy;

    private LocalDateTime dueAt;
    @Column(nullable=false) @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // Si de una tarea nace una visita:
    @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="created_field_visit_id")
    private FieldVisit createdFieldVisit;
}
