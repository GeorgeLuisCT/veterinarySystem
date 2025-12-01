package com.gaedet.biocampovet.core.clinic.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TreatmentScheduleBriefResponse {
    private Long id;
    private String treatmentName;
    private LocalDateTime scheduledTime;
    private boolean completed;
}
