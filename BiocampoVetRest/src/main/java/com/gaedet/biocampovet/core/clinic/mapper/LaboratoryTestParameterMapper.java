package com.gaedet.biocampovet.core.clinic.mapper;

import com.gaedet.biocampovet.core.clinic.dto.LaboratoryTestParameterResponse;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryTestParameter;

public class LaboratoryTestParameterMapper {

    public static LaboratoryTestParameterResponse toResponse(LaboratoryTestParameter parameter) {
        return LaboratoryTestParameterResponse.fromEntity(parameter);
    }
}
