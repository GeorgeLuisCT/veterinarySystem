package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateSurgicalOrderRequest {

    private Long recommendedServiceId;
    private Long requestedById;
    private Long operatingRoomId;
    private String notes;
    private SurgicalOrderStatus status;
}
