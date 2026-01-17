package com.gaedet.veterinarysystem.core.fieltd.mapper;

import com.gaedet.veterinarysystem.core.fieltd.dto.FieldRouteDayResponse;
import com.gaedet.veterinarysystem.core.fieltd.dto.FieldRouteStopResponse;
import com.gaedet.veterinarysystem.core.fieltd.entity.FieldRouteDay;
import com.gaedet.veterinarysystem.core.fieltd.entity.FieldRouteStop;

import java.util.List;
import java.util.stream.Collectors;

public class RouteMapper {
    public static FieldRouteDayResponse toResponse(FieldRouteDay e) {
        return FieldRouteDayResponse.builder()
                .id(e.getId())
                .routeDate(e.getRouteDate())
                .employeeId(e.getEmployee() != null ? e.getEmployee().getId() : null)
                .employeeName(e.getEmployee() != null ? e.getEmployee().getFullName() : null)
                .vehicleId(e.getVehicle() != null ? e.getVehicle().getId() : null)
                .vehicleName(e.getVehicle() != null ? e.getVehicle().getName() : null)
                .stops(e.getStops() == null ? List.of() : e.getStops().stream().map(RouteMapper::toStop).collect(Collectors.toList()))
                .build();
    }

    public static FieldRouteStopResponse toStop(FieldRouteStop s) {
        return FieldRouteStopResponse.builder()
                .id(s.getId())
                .position(s.getPosition())
                .fieldVisitId(s.getFieldVisit() != null ? s.getFieldVisit().getId() : null)
                .farmName(s.getFieldVisit() != null && s.getFieldVisit().getFarm() != null ? s.getFieldVisit().getFarm().getName() : null)
                .eta(s.getEta())
                .build();
    }
}

