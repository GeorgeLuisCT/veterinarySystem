package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.animal.dto.AnimalBasicResponse;
import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.clinic.enums.GroomingStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class GroomingSessionSummaryResponse {
    private final Long id;
    private final Long version;
    private final Long attentionId;
    private final LocalDateTime startedAt;
    private final LocalDateTime finishedAt;
    private final GroomingStatus status;
    private final AnimalBasicResponse animalBasicResponse;
    private final String serviceName;
    private final BranchResponse branch;
    private final Long assignedProfessionalId;
    private final String assignedProfessionalFullName;
    private final BigDecimal chargedPrice;
}
