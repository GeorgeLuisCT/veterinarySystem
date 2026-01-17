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
public class CreateSurgicalAppointmentRequest {

    @NotNull
    private Long animalId;

    @NotNull
    private Long branchId;

    private Long orderId;

    @NotNull
    private Long finalServiceId;

    @NotNull
    private Long surgeonId;

    private Long anesthetistId;
    private Long operatingRoomId;

    @NotNull
    private LocalDateTime startDateTime;

    @Positive
    private Integer estimatedDurationMinutes;

    private String prepInstructions;
}
