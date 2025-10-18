package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.GroomingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GroomingSessionDetailResponse {
    private final Long id;
    private final Long version;
    private final Long attentionId;
    private final GroomingStatus status;
    private final LocalDateTime startedAt;
    private final LocalDateTime finishedAt;
    private final Long assignedProfessionalId;
    private final String assignedProfessionalFullName;
    private final BigDecimal chargedPrice;
    private final String behaviorNotes;
    private final String clinicalObservations;
    private final GroomingSessionSummaryResponse summary;
    private final List<GroomingMaterialResponse> materialsUsed;
    private final List<String> photoUrls;
}
