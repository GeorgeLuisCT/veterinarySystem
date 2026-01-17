package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.LabUnit;
import com.gaedet.veterinarysystem.core.clinic.enums.LabValueType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Getter
@Setter
@NoArgsConstructor
public class CreateLaboratoryTestParameterRequest {
    @NotBlank
    @Size(max = 80)
    private String name;

    @NotNull
    private LabValueType valueType;

    @NotNull(message = "La unidad es obligatoria")
    private LabUnit unit;

    @Size(max = 400)
    private String allowedOptions;

    private Double refMin;
    private Double refMax;

    @Size(max = 200)
    private String refText;

    private Integer decimals;
}