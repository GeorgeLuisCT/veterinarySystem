package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.GroomingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.openapitools.jackson.nullable.JsonNullable;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGroomingSessionRequest {

    private Long version;
    private JsonNullable<LocalDateTime> startedAt;
    private JsonNullable<LocalDateTime> finishedAt;
    private JsonNullable<Long> assignedProfessionalId;
    private JsonNullable<BigDecimal> chargedPrice;
    private JsonNullable<GroomingStatus> status;
    private JsonNullable<String> behaviorNotes;
    private JsonNullable<String> clinicalObservations;
}
