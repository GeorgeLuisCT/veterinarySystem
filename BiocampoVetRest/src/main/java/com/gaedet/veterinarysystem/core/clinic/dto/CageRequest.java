package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.CageSize;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Getter
@Setter
public class CageRequest {

    @NotBlank(message = "El nombre no puede estar vacío")
    private String name;

    @NotNull(message = "El tamaño no puede estar vacío")
    private CageSize size;

    @NotNull(message = "La sucursal es obligatoria")
    private Long branchId;
}
