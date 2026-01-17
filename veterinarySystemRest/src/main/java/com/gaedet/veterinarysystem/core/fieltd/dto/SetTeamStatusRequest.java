package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.fieltd.enums.FieldTeamStatus;
import lombok.*;

import javax.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SetTeamStatusRequest {
    @NotNull
    private Long employeeId;
    @NotNull
    private FieldTeamStatus status;
    private Long currentVisitId;
    private String locationText;
    private String gpsCoordinates;
}
