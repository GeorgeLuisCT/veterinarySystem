package com.gaedet.veterinarysystem.core.employees.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class EmployeeUpdateRequest extends BaseEmployeeRequest {

    @NotNull(message = "El ID del empleado es obligatorio")
    private Long id;
}
