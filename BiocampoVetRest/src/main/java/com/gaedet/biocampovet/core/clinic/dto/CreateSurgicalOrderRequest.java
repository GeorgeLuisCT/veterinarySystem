package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.SurgicalOrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSurgicalOrderRequest {

    @NotNull
    private Long animalId;

    @NotNull
    private Long recommendedServiceId;

    @NotNull
    private Long requestedById;

    private Long operationRoomId;

    private String notes;
    private SurgicalOrderStatus status;
}
