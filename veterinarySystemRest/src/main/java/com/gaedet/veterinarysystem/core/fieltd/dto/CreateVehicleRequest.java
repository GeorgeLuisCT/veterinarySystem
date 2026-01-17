package com.gaedet.veterinarysystem.core.fieltd.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.NotBlank;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CreateVehicleRequest {
    @NotBlank
    private String name;
    private String licensePlate;
    private Long assignedVetEmployeeId;
    private Long homeBranchId;
    private Boolean active;
}
