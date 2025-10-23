package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class VehiclePingResponse {
    private Long id;
    private Long vehicleId;
    private LocalDateTime timestamp;
    private Double latitude;
    private Double longitude;
    private Double speedKmh;
    private String note;
}
