package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddClinicalAttentionSurgicalOrderRequest {

    @NotNull
    private Long recommendedServiceId;

    @NotNull
    private Long requestedByEmployeeId;

    private Long operatingRoomId;

    private SurgicalOrderStatus status;

    private String notes;
}
