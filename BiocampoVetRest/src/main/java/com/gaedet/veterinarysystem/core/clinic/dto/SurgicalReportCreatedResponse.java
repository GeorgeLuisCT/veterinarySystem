package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalReportStatus;

import java.time.LocalDateTime;

public record SurgicalReportCreatedResponse(
        Long surgicalReportId,
        Long attentionId,
        LocalDateTime surgeryStartAt,
        LocalDateTime surgeryEndAt,
        Long surgeonId,
        SurgicalReportStatus status
) {}
