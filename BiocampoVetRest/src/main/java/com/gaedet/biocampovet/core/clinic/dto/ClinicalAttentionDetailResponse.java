package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.ClinicalAttentionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

import lombok.*;

@Getter
@Builder
@AllArgsConstructor
public class ClinicalAttentionDetailResponse {
    private final Long id;
    private final Long version;
    private final Long attentionId;
    private final ClinicalAttentionStatus status;
    private final LocalDateTime visitDate;
    private final String subjective;
    private final String objective;
    private final String assessment;
    private final String plan;
    private final Double weightKg;
    private final Double temperatureCelsius;
    private final Integer heartRate;
    private final Integer respiratoryRate;
    private final ClinicalAttentionSummaryResponse summary;
    private final List<MedicationAdministrationResponse> medicationAdministrations;
    private final List<ClinicalServiceItemResponse> serviceItems;
    private final List<SurgicalOrderResponse> surgicalOrders;
    private final List<LaboratoryRequestResponse> laboratoryRequests;
}
