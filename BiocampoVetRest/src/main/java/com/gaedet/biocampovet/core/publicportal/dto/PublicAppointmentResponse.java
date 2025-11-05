package com.gaedet.biocampovet.core.publicportal.dto;

import com.gaedet.biocampovet.core.clinic.enums.AppointmentStatus;
import com.gaedet.biocampovet.core.clinic.enums.AppointmentType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class PublicAppointmentResponse {
    private final Long appointmentId;
    private final AppointmentStatus status;
    private final AppointmentType type;
    private final LocalDateTime requestedStart;
    private final String branchName;
    private final String animalName;
}
