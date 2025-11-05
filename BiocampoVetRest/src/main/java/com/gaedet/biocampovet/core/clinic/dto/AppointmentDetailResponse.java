package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.clinic.enums.AppointmentStatus;
import com.gaedet.biocampovet.core.clinic.enums.AppointmentType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AppointmentDetailResponse {
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
    private final String requesterName;
    private final String requesterEmail;
    private final String requesterPhone;
    private final String requestNotes;
    private final ClinicalAppointmentDetailResponse clinicalDetail;
    private final GroomingAppointmentDetailResponse groomingDetail;
    private final SurgicalAppointmentDetailResponse surgicalDetail;
}
