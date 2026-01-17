package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.fieltd.enums.GeoZoneType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CreateGeoZoneRequest {
    @NotBlank
    private String name;

    @NotNull
    private GeoZoneType type;

    private Long parentId;
    private String gpsCoordinates;
    private Boolean active;
}
