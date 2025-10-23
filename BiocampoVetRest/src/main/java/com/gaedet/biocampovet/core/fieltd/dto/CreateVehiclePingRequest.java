package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CreateVehiclePingRequest {
    @NotNull
    private Long vehicleId;
    private Long employeeId;
    @NotNull
    private LocalDateTime timestamp;
    @NotNull
    private Double latitude;
    @NotNull
    private Double longitude;
    private Double speedKmh;
    private String note;
}
