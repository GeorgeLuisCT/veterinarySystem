package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.AttentionsStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAttentionFromAppointmentRequest {

    @NotNull
    private Long appointmentId;

    private Long attendingEmployeeId;

    private LocalDateTime checkInTime;

    private Boolean emergency;

    private AttentionsStatus status;
}
