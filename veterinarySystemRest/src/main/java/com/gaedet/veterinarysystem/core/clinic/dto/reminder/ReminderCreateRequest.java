package com.gaedet.veterinarysystem.core.clinic.dto.reminder;

import com.gaedet.veterinarysystem.core.clinic.enums.ReminderType;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.FutureOrPresent;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

@Getter
@Setter
public class ReminderCreateRequest {

    @NotNull(message = "El animal es obligatorio")
    private Long animalId;

    @NotNull(message = "El tipo de recordatorio es obligatorio")
    private ReminderType reminderType;

    @NotNull(message = "La fecha prevista es obligatoria")
    @FutureOrPresent(message = "La fecha del recordatorio no puede estar en el pasado")
    private LocalDate dueDate;
}
