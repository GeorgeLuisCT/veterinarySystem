package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import lombok.*;

import java.time.LocalTime;

@Entity @Table(name="field_route_stop")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FieldRouteStop {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="route_day_id", nullable=false)
    private FieldRouteDay routeDay;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="field_visit_id", nullable=false)
    private FieldVisit fieldVisit;

    @Column(nullable=false) private Integer position; // orden del día
    private LocalTime eta;  // estimado
}
