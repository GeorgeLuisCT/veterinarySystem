package com.gaedet.veterinarysystem.core.publicportal.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.AppointmentType;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Email;
import javax.validation.constraints.FutureOrPresent;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.PositiveOrZero;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

@Getter
@Setter
public class PublicAppointmentRequest {

    @NotNull
    private Long documentTypeId;

    @NotBlank
    @Size(max = 64)
    private String documentNumber;

    @NotNull
    private Long animalId;

    @NotNull
    private Long branchId;

    @NotNull
    private AppointmentType type;

    @NotNull
    @FutureOrPresent
    private LocalDateTime preferredDateTime;

    @PositiveOrZero
    private Integer estimatedDurationMinutes;

    @NotBlank
    @Size(max = 160)
    private String requesterName;

    @Email
    @Size(max = 160)
    private String requesterEmail;

    @Size(max = 64)
    private String requesterPhone;

    @Size(max = 2000)
    private String notes;
}
