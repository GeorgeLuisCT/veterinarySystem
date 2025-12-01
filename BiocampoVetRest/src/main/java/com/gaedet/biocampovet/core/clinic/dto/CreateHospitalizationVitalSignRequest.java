package com.gaedet.biocampovet.core.clinic.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

@Getter
@Setter
public class CreateHospitalizationVitalSignRequest {

    @NotNull
    private Long recordedByEmployeeId;

    private LocalDateTime recordedAt;

    @Positive(message = "El peso debe ser mayor que cero.")
    private Double weightKg;

    @Positive(message = "La temperatura debe ser mayor que cero.")
    private Double temperatureCelsius;

    @Min(value = 1, message = "La frecuencia cardiaca debe ser mayor que cero.")
    private Integer heartRate;

    @Min(value = 1, message = "La frecuencia respiratoria debe ser mayor que cero.")
    private Integer respiratoryRate;

    public boolean hasAnyMeasurement() {
        return weightKg != null || temperatureCelsius != null || heartRate != null || respiratoryRate != null;
    }
}
