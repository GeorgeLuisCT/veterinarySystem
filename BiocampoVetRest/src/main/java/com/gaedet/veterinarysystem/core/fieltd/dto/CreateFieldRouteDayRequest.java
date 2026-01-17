package com.gaedet.veterinarysystem.core.fieltd.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CreateFieldRouteDayRequest {
    @NotNull
    private Long employeeId;
    private Long vehicleId;
    @NotNull
    private LocalDate routeDate;
    private List<CreateFieldRouteStopRequest> stops;
}
