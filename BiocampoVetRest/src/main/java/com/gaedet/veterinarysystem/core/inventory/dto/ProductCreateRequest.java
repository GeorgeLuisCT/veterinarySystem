package com.gaedet.veterinarysystem.core.inventory.dto;

import lombok.*;

import javax.validation.constraints.*;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProductCreateRequest extends BaseProductRequest {

    @NotEmpty(message = "Debes seleccionar al menos una sucursal")
    private Set<Long> branchIds;
}

