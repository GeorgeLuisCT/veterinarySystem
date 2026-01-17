package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.fieltd.enums.FieldTaskPriority;
import com.gaedet.veterinarysystem.core.fieltd.enums.FieldTaskStatus;
import com.gaedet.veterinarysystem.core.fieltd.enums.FieldVisitStatus;
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
public class FieldTaskSummaryResponse {
    private Long id;
    private String title;
    private Long farmId;
    private String farmName;
    private Long zoneId;
    private String zoneName;
    private FieldTaskPriority priority;
    private FieldTaskStatus status;
    private Long assignedToId;
    private String assignedToName;
    private LocalDateTime dueAt;
    private Long createdFieldVisitId;
    private FieldVisitStatus createdFieldVisitStatus;
    private Long vehicleId;
    private String vehicleName;
}
