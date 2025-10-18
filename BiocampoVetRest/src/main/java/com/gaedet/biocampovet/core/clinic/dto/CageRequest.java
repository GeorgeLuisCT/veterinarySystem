package com.gaedet.biocampovet.core.clinic.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Getter
@Setter
public class CageRequest {

    @NotBlank(message = "El nombre no puede estar vacío")
    private String name;

    private String size;

    @NotNull(message = "La sucursal es obligatoria")
    private Long branchId;
}
