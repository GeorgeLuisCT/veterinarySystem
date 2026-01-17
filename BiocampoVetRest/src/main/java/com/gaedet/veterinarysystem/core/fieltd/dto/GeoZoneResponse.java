package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.fieltd.enums.GeoZoneType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeoZoneResponse {
    private Long id;
    private String name;
    private GeoZoneType type;
    private Long parentId;
    private String parentName;
    private String gpsCoordinates;
    private boolean active;
}
