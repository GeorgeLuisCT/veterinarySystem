package com.gaedet.veterinarysystem.core.clinic.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class HospitalizationVitalSignResponse {
    private Long id;
    private Long hospitalizationId;
    private Double weightKg;
    private Double temperatureCelsius;
    private Integer heartRate;
    private Integer respiratoryRate;
    private LocalDateTime recordedAt;
    private Long recordedByEmployeeId;
    private String recordedByEmployeeFullName;
}
