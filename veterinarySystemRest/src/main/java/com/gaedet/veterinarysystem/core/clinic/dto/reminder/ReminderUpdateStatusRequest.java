package com.gaedet.veterinarysystem.core.clinic.dto.reminder;

import com.gaedet.veterinarysystem.core.clinic.enums.ReminderStatus;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;

@Getter
@Setter
public class ReminderUpdateStatusRequest {

    @NotNull(message = "El estado es obligatorio")
    private ReminderStatus status;
}
