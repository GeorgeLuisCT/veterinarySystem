package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryTestParameter;
import com.gaedet.veterinarysystem.core.clinic.enums.LabUnit;
import com.gaedet.veterinarysystem.core.clinic.enums.LabValueType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LaboratoryTestParameterResponse {
    private Long id;
    private String name;
    private LabValueType valueType;
    private LabUnit unit;
    private String allowedOptions;
    private Double refMin;
    private Double refMax;
    private String refText;
    private Integer decimals;

    public static LaboratoryTestParameterResponse fromEntity(LaboratoryTestParameter entity) {
        return LaboratoryTestParameterResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .valueType(entity.getValueType())
                .unit(entity.getUnit())
                .allowedOptions(entity.getAllowedOptions())
                .refMin(entity.getRefMin())
                .refMax(entity.getRefMax())
                .refText(entity.getRefText())
                .decimals(entity.getDecimals())
                .build();
    }
}
