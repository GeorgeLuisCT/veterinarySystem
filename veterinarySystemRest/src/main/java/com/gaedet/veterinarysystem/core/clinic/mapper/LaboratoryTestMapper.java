package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.clinic.dto.CreateLaboratoryTestRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.LaboratoryStateResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.LaboratoryTestResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.LaboratoryTestSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.UpdateLaboratoryTestRequest;
import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryTest;
import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryTestParameter;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

public class LaboratoryTestMapper {

    private static List<LaboratoryStateResponse> mapLaboratoryStates(LaboratoryTest e) {
        if (e.getLaboratoryLinks() == null) {
            return List.of();
        }
        return e.getLaboratoryLinks().stream()
                .map(l -> LaboratoryStateResponse.builder()
                        .laboratoryId(l.getLaboratory().getId())
                        .laboratoryName(l.getLaboratory().getName())
                        .active(l.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    public static LaboratoryTestSummaryResponse toSummary(LaboratoryTest e) {
        return LaboratoryTestSummaryResponse.builder()
                .id(e.getId())
                .code(e.getCode())
                .name(e.getName())
                .price(e.getPrice())
                .active(e.isActive())
                .laboratories(mapLaboratoryStates(e))
                .build();
    }

    public static LaboratoryTestResponse toResponse(LaboratoryTest e) {
        return LaboratoryTestResponse.builder()
                .id(e.getId())
                .code(e.getCode())
                .name(e.getName())
                .price(e.getPrice())
                .active(e.isActive())
                .description(e.getDescription())
                .parameters(e.getParameters() == null ? List.of() : e.getParameters().stream()
                        .map(LaboratoryTestParameterMapper::toResponse)
                        .collect(Collectors.toList()))
                .laboratories(mapLaboratoryStates(e))
                .build();
    }

    public static void applyCreate(LaboratoryTest target, CreateLaboratoryTestRequest r) {
        target.setCode(r.getCode().trim());
        target.setName(r.getName().trim());
        target.setDescription(trimToNull(r.getDescription()));
        target.setPrice(r.getPrice());
        target.setActive(r.isActive());
        overwriteParameters(target, r);
    }

    public static void applyUpdate(LaboratoryTest target, UpdateLaboratoryTestRequest r) {
        target.setCode(r.getCode().trim());
        target.setName(r.getName().trim());
        target.setDescription(trimToNull(r.getDescription()));
        target.setPrice(r.getPrice());
        target.setActive(r.isActive());
        overwriteParameters(target, r);
    }

    private static void overwriteParameters(LaboratoryTest target, UpdateLaboratoryTestRequest r) {
        if (target.getParameters() == null) {
            target.setParameters(new HashSet<>());
        }
        target.getParameters().clear();
        if (r.getParameters() != null) {
            r.getParameters().forEach(p -> {
                LaboratoryTestParameter param = new LaboratoryTestParameter();
                param.setName(p.getName());
                param.setValueType(p.getValueType());
                param.setUnit(p.getUnit());
                param.setAllowedOptions(p.getAllowedOptions());
                param.setRefMin(p.getRefMin());
                param.setRefMax(p.getRefMax());
                param.setRefText(p.getRefText());
                param.setDecimals(p.getDecimals());
                param.setTest(target);
                target.getParameters().add(param);
            });
        }
    }

    private static void overwriteParameters(LaboratoryTest target, CreateLaboratoryTestRequest r) {
        if (target.getParameters() == null) {
            target.setParameters(new HashSet<>());
        }
        target.getParameters().clear();
        if (r.getParameters() != null) {
            r.getParameters().forEach(p -> {
                LaboratoryTestParameter param = new LaboratoryTestParameter();
                param.setName(p.getName());
                param.setValueType(p.getValueType());
                param.setUnit(p.getUnit());
                param.setAllowedOptions(p.getAllowedOptions());
                param.setRefMin(p.getRefMin());
                param.setRefMax(p.getRefMax());
                param.setRefText(p.getRefText());
                param.setDecimals(p.getDecimals());
                param.setTest(target);
                target.getParameters().add(param);
            });
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        var trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
