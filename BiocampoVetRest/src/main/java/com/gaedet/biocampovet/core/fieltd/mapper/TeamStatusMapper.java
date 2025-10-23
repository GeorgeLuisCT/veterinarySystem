package com.gaedet.biocampovet.core.fieltd.mapper;

import com.gaedet.biocampovet.core.fieltd.dto.TeamStatusResponse;
import com.gaedet.biocampovet.core.fieltd.entity.FieldTeamStatusEntity;

public class TeamStatusMapper {
    public static TeamStatusResponse toResponse(FieldTeamStatusEntity e) {
        var visit = e.getCurrentVisit();
        var farm = visit != null ? visit.getFarm() : null;
        var zone = visit != null ? (visit.getZone() != null ? visit.getZone() : (farm != null ? farm.getZone() : null)) : null;
        return TeamStatusResponse.builder()
                .employeeId(e.getEmployee().getId())
                .employeeName(e.getEmployee().getFullName())
                .status(e.getStatus())
                .currentVisitId(visit != null ? visit.getId() : null)
                .currentVisitFarmId(farm != null ? farm.getId() : null)
                .currentVisitFarmName(farm != null ? farm.getName() : null)
                .currentVisitZoneId(zone != null ? zone.getId() : null)
                .currentVisitZoneName(zone != null ? zone.getName() : null)
                .locationText(e.getLocationText())
                .gpsCoordinates(e.getGpsCoordinates())
                .build();
    }
}
