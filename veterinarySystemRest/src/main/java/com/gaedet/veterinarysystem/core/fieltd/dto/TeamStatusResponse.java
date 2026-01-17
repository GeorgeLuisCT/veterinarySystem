package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.fieltd.enums.FieldTeamStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamStatusResponse {
    private Long employeeId;
    private String employeeName;
    private FieldTeamStatus status;
    private Long currentVisitId;
    private Long currentVisitFarmId;
    private String currentVisitFarmName;
    private Long currentVisitZoneId;
    private String currentVisitZoneName;
    private String locationText;
    private String gpsCoordinates;
}
