package com.gaedet.veterinarysystem.core.clinic.dto.reminder;

import com.gaedet.veterinarysystem.core.animal.enums.AnimalSpecies;
import com.gaedet.veterinarysystem.core.clinic.enums.ReminderStatus;
import com.gaedet.veterinarysystem.core.clinic.enums.ReminderType;

import java.time.LocalDate;

public record ReminderListItemResponse(
        Long id,
        String externalId,
        boolean automatic,
        boolean deletable,
        ReminderType reminderType,
        ReminderStatus status,
        LocalDate dueDate,
        String subject,
        String detail,
        Long animalId,
        String animalName,
        AnimalSpecies animalSpecies,
        Long ownerId,
        String ownerName,
        String ownerPhone,
        String ownerEmail,
        String branchName
) {
}
