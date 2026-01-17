package com.gaedet.veterinarysystem.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Plan diario por veterinario (y, opcionalmente, vehículo).
 */
@Entity @Table(name="field_route_day",
        uniqueConstraints=@UniqueConstraint(columnNames={"employee_id","route_date"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FieldRouteDay {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="employee_id", nullable=false)
    private Employee employee;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="vehicle_id")
    private Vehicle vehicle;

    @Column(name="route_date", nullable=false)
    private LocalDate routeDate;

    @OneToMany(mappedBy="routeDay", cascade=CascadeType.ALL, orphanRemoval=true)
    @OrderBy("position asc")
    @Builder.Default private List<FieldRouteStop> stops = new ArrayList<>();
}
