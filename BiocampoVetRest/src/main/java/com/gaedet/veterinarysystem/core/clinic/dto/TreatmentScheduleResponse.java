package com.gaedet.veterinarysystem.core.clinic.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class TreatmentScheduleResponse {
    private Long id;
    private Long hospitalizationId;
    private String treatmentName;
    private LocalDateTime scheduledTime;
    @JsonProperty("isCompleted")
    private boolean isCompleted;
    private LocalDateTime completedAt;
    private Long completedByEmployeeId;
    private String completedByEmployeeFullName;
    private String notes;
    private List<TreatmentScheduleProductUsageResponse> products;
}
