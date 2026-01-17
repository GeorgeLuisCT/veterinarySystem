package com.gaedet.veterinarysystem.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.veterinarysystem.core.customer.entity.Customer;
import lombok.*;

/**
 * Representa una finca, granja o unidad de producción
 * que recibe visitas de campo.
 */
@Entity
@Table(name = "farms")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Farm {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id")
    private GeoZone zone;

    private String locationDescription;
    private String gpsCoordinates;
    private String addressLabel;
}