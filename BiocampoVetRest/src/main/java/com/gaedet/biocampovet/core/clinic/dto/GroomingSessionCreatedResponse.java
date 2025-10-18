package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.GroomingStatus;

import java.time.LocalDateTime;

public record GroomingSessionCreatedResponse(
        Long groomingSessionId,
        Long attentionId,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        Long assignedProfessionalId,
        GroomingStatus status
) {}
