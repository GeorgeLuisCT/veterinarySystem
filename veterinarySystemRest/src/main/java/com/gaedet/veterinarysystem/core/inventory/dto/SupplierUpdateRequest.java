package com.gaedet.veterinarysystem.core.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SupplierUpdateRequest extends BaseSupplierRequest {

    @NotNull(message = "El ID del proveedor es obligatorio")
    private Long id;
}