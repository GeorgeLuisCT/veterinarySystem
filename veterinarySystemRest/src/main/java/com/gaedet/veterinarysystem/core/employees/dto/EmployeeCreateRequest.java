package com.gaedet.veterinarysystem.core.employees.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotEmpty;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class EmployeeCreateRequest extends BaseEmployeeRequest {

    @NotEmpty(message = "Debes seleccionar al menos una sucursal")
    private Set<Long> branchIds;
}
