package com.gaedet.veterinarysystem.core.clinic.dto;

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
public class AssignAppointmentEmployeeRequest {

    @NotNull
    private Long employeeId;
}
