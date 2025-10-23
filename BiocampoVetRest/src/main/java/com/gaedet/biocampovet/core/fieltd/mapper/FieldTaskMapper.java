package com.gaedet.biocampovet.core.fieltd.mapper;

import com.gaedet.biocampovet.core.fieltd.dto.FieldTaskResponse;
import com.gaedet.biocampovet.core.fieltd.dto.FieldTaskSummaryResponse;
import com.gaedet.biocampovet.core.fieltd.entity.FieldTask;

public class FieldTaskMapper {
    public static FieldTaskSummaryResponse toSummary(FieldTask e) {
        var farm = e.getFarm();
        var zone = e.getZone() != null ? e.getZone() : (farm != null ? farm.getZone() : null);
        var visit = e.getCreatedFieldVisit();
        var vehicle = visit != null ? visit.getVehicle() : null;
        return FieldTaskSummaryResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .farmId(farm != null ? farm.getId() : null)
                .farmName(farm != null ? farm.getName() : null)
                .zoneId(zone != null ? zone.getId() : null)
                .zoneName(zone != null ? zone.getName() : null)
                .priority(e.getPriority())
                .status(e.getStatus())
                .assignedToId(e.getAssignedTo() != null ? e.getAssignedTo().getId() : null)
                .assignedToName(e.getAssignedTo() != null ? e.getAssignedTo().getFullName() : null)
                .dueAt(e.getDueAt())
                .createdFieldVisitId(visit != null ? visit.getId() : null)
                .createdFieldVisitStatus(visit != null ? visit.getStatus() : null)
                .vehicleId(vehicle != null ? vehicle.getId() : null)
                .vehicleName(vehicle != null ? vehicle.getName() : null)
                .build();
    }
    public static FieldTaskResponse toResponse(FieldTask e) {
        FieldTaskResponse r = new FieldTaskResponse();
        FieldTaskSummaryResponse summary = toSummary(e);
        r.setId(summary.getId());
        r.setTitle(summary.getTitle());
        r.setFarmId(summary.getFarmId());
        r.setFarmName(summary.getFarmName());
        r.setZoneId(summary.getZoneId());
        r.setZoneName(summary.getZoneName());
        r.setPriority(summary.getPriority());
        r.setStatus(summary.getStatus());
        r.setAssignedToId(summary.getAssignedToId());
        r.setAssignedToName(summary.getAssignedToName());
        r.setDueAt(summary.getDueAt());
        r.setCreatedFieldVisitId(summary.getCreatedFieldVisitId());
        r.setCreatedFieldVisitStatus(summary.getCreatedFieldVisitStatus());
        r.setVehicleId(summary.getVehicleId());
        r.setVehicleName(summary.getVehicleName());
        r.setDescription(e.getDescription());
        return r;
    }
}
