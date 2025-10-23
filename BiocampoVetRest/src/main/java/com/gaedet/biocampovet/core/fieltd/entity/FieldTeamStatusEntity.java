package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.fieltd.enums.FieldTeamStatus;
import lombok.*;

import java.time.LocalDateTime;

@Entity @Table(name="field_team_status",
        uniqueConstraints=@UniqueConstraint(columnNames={"employee_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FieldTeamStatusEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="employee_id", nullable=false)
    private Employee employee;

    @Enumerated(EnumType.STRING) @Column(nullable=false)
    private FieldTeamStatus status;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="current_visit_id")
    private FieldVisit currentVisit;

    private String locationText; // “Carretera a Jaén…”
    private String gpsCoordinates; // “lat,lon”
    private LocalDateTime lastPingAt;
}
