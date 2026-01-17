package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.branches.dto.BranchResponse;
import com.gaedet.veterinarysystem.core.clinic.enums.AppointmentStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.AppointmentType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AppointmentSummaryResponse {

    private final Long id;
    private final AppointmentType type;
    private final AppointmentStatus status;
    private final LocalDateTime startDateTime;
    private final Integer estimatedDurationMinutes;
    private final BranchResponse branch;
    private final Long animalId;
    private final String animalName;
    private final Long assignedEmployeeId;
    private final String assignedEmployeeFullName;
}
