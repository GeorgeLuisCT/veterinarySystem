package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.clinic.dto.LaboratoryTestParameterResponse;
import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryTestParameter;

public class LaboratoryTestParameterMapper {

    public static LaboratoryTestParameterResponse toResponse(LaboratoryTestParameter parameter) {
        return LaboratoryTestParameterResponse.fromEntity(parameter);
    }
}
