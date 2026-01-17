package com.gaedet.veterinarysystem.core.inventory.dto;

import lombok.*;

import javax.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProductUpdateRequest extends BaseProductRequest {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long id;
}