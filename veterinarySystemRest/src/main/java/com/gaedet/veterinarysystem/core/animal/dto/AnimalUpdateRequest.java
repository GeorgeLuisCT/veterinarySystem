package com.gaedet.veterinarysystem.core.animal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class AnimalUpdateRequest extends BaseAnimalRequest {

    @NotNull(message = "El ID del animal es obligatorio")
    private Long id;
}
