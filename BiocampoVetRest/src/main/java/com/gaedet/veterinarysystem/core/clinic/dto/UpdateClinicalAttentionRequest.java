package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalAttentionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import org.openapitools.jackson.nullable.JsonNullable;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateClinicalAttentionRequest {
    private Long version;
    private JsonNullable<LocalDateTime> visitDate;
    private JsonNullable<ClinicalAttentionStatus> status;
    private JsonNullable<String> subjective;
    private JsonNullable<String> objective;
    private JsonNullable<String> assessment;
    private JsonNullable<String> plan;
    private JsonNullable<Double> weightKg;
    private JsonNullable<Double> temperatureCelsius;
    private JsonNullable<Integer> heartRate;
    private JsonNullable<Integer> respiratoryRate;
}

