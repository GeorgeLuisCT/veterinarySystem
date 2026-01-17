package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.fieltd.enums.GeoZoneType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeoZoneSummaryResponse {
    private Long id;
    private String name;
    private GeoZoneType type;
    private Long parentId;
    private String parentName;
    private boolean active;
}
