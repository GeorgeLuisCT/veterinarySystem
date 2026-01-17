package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.fieltd.enums.FieldVisitStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FieldVisitSummaryResponse {
    private Long id;
    private Long farmId;
    private String farmName;
    private Long zoneId;
    private String zoneName;
    private LocalDateTime scheduledDateTime;
    private FieldVisitStatus status;
    private Long fieldVetId;
    private String fieldVetName;
    private Long vehicleId;
    private String vehicleName;
    private String objective;
    private List<FieldVisitCompanionResponse> companions;
}
