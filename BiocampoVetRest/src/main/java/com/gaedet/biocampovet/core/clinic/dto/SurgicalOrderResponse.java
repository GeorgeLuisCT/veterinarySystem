package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.SurgicalOrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SurgicalOrderResponse {

    private final Long id;
    private final Long animalId;
    private final String animalName;
    private final String operationRoomName;
    private final Long operationRoomId;
    private final Long recommendedServiceId;
    private final String recommendedServiceName;
    private final Long requestedById;
    private final String requestedByFullName;
    private final SurgicalOrderStatus status;
    private final String notes;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final Long scheduledAppointmentId;
    private final LocalDateTime scheduledAppointmentStart;
}
