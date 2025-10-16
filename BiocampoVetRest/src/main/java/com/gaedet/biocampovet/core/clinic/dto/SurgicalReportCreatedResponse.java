package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.SurgicalReportStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record SurgicalReportCreatedResponse(
        Long surgicalReportId,
        Long attentionId,
        LocalDateTime surgeryStartAt,
        LocalDateTime surgeryEndAt,
        Long surgeonId,
        SurgicalReportStatus status
) {}
