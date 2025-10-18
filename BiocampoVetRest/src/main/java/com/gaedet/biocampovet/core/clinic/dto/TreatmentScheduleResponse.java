package com.gaedet.biocampovet.core.clinic.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class TreatmentScheduleResponse {
    private Long id;
    private Long hospitalizationId;
    private String treatmentName;
    private LocalDateTime scheduledTime;
    private boolean isCompleted;
    private LocalDateTime completedAt;
    private Long completedByEmployeeId;
    private String completedByEmployeeFullName;
    private String notes;
}
