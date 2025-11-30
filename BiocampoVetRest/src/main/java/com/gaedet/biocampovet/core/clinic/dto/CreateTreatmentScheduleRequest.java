package com.gaedet.biocampovet.core.clinic.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Getter
@Setter
public class CreateTreatmentScheduleRequest {
    @NotBlank(message = "Treatment name is required")
    private String treatmentName;

    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledTime;

    private String notes;

    private Integer frequencyValue;
    private com.gaedet.biocampovet.core.clinic.enums.FrequencyUnit frequencyUnit;
    private Integer numberOfDoses;
}
