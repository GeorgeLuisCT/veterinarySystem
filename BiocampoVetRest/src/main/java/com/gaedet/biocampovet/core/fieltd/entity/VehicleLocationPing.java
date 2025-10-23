package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.employees.entity.Employee;
import lombok.*;

import java.time.LocalDateTime;


@Entity @Table(name="vehicle_location_ping",
        indexes=@Index(columnList="timestamp"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VehicleLocationPing {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="vehicle_id", nullable=false)
    private Vehicle vehicle;

    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="employee_id")
    private Employee employee; // quien iba conduciendo

    @Column(nullable=false) private LocalDateTime timestamp;
    @Column(nullable=false) private Double latitude;
    @Column(nullable=false) private Double longitude;

    private Double speedKmh;
    private String note;
}
