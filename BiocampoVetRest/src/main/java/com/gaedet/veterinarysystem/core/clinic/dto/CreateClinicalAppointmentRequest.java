package com.gaedet.veterinarysystem.core.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateClinicalAppointmentRequest {

    @NotNull
    private Long animalId;

    @NotNull
    private Long branchId;

    @NotNull
    private Long clinicalServiceId;

    @NotNull
    private Long veterinarianId;

    @NotNull
    private LocalDateTime startDateTime;

    @Positive
    private Integer estimatedDurationMinutes;

    private String consultationReason;
    private String clinicalNotes;
}
