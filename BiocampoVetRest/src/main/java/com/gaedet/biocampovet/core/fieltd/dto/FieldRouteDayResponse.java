package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FieldRouteDayResponse {
    private Long id;
    private LocalDate routeDate;
    private Long employeeId;
    private String employeeName;
    private Long vehicleId;
    private String vehicleName;
    private List<FieldRouteStopResponse> stops;
}
