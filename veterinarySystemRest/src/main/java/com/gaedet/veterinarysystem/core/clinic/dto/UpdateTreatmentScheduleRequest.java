package com.gaedet.veterinarysystem.core.clinic.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
public class UpdateTreatmentScheduleRequest {
    @NotNull
    private Boolean isCompleted;
    private Long completedByEmployeeId;
    private String notes;

    @Valid
    private List<TreatmentScheduleProductUsageRequest> products;
}
