package com.gaedet.veterinarysystem.core.fieltd.dto;

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
public class CreateFarmRequest {
    @NotNull
    private Long customerId;

    @NotBlank
    private String name;

    private Long zoneId;
    private String locationDescription;
    private String gpsCoordinates;
    private String addressLabel;
}
