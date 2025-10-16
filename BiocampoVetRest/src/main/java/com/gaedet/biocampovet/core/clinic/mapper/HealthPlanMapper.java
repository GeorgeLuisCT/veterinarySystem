package com.gaedet.biocampovet.core.clinic.mapper;

import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.entity.HealthPlan;
import com.gaedet.biocampovet.core.clinic.entity.HealthPlanServiceItem;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class HealthPlanMapper {

    private HealthPlanMapper() {
    }

    public static HealthPlanResponse toResponse(HealthPlan entity) {
        List<HealthPlanServiceItemResponse> items = entity.getServiceItems() == null
                ? List.of()
                : entity.getServiceItems().stream()
                .filter(Objects::nonNull)
                .map(HealthPlanMapper::toItemResponse)
                .collect(Collectors.toList());

        return HealthPlanResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .price(entity.getPrice())
                .notes(entity.getNotes())
                .serviceItems(items)
                .build();
    }

    public static HealthPlanServiceItemResponse toItemResponse(HealthPlanServiceItem item) {
        return HealthPlanServiceItemResponse.builder()
                .id(item.getId())
                .clinicalServiceId(item.getClinicalService() != null ? item.getClinicalService().getId() : null)
                .clinicalServiceName(item.getClinicalService() != null ? item.getClinicalService().getName() : null)
                .quantity(item.getQuantity())
                .notes(item.getNotes())
                .build();
    }

    public static void applyCreate(HealthPlan target, CreateHealthPlanRequest request) {
        target.setName(trimmed(request.getName()));
        target.setDescription(trimToNull(request.getDescription()));
        target.setPrice(request.getPrice());
        target.setNotes(trimToNull(request.getNotes()));
    }

    public static void applyUpdate(HealthPlan target, UpdateHealthPlanRequest request) {
        applyCreate(target, request);
    }

    private static String trimmed(String value) {
        if (value == null) {
            return null;
        }
        return value.trim();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
