package com.gaedet.biocampovet.core.fieltd.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.fieltd.enums.GeoZoneType;
import lombok.*;

@Entity
@Table(name = "geo_zones",
        uniqueConstraints = @UniqueConstraint(columnNames = {"name","parent_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GeoZone {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private GeoZoneType type = GeoZoneType.SECTOR;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private GeoZone parent;

    private String gpsCoordinates;

    @Builder.Default
    private boolean active = true;
}
