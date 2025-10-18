package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.GroomingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroomingSessionRequest {

    @NotNull
    private Long attentionId;

    @NotNull
    private LocalDateTime startedAt;

    private LocalDateTime finishedAt;

    private Long assignedProfessionalId;

    private BigDecimal chargedPrice;

    private String behaviorNotes;

    private String clinicalObservations;

    private GroomingStatus status;
}
