package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.branches.dto.BranchStateResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.ClinicalServiceRequiredProductResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.ClinicalServiceResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.ClinicalServiceSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.CreateClinicalServiceRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.UpdateClinicalServiceRequest;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalService;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class ClinicalServiceMapper {

    private static List<BranchStateResponse> mapBranchStates(ClinicalService e) {
        if (e.getBranchLinks() == null) {
            return List.of();
        }
        return e.getBranchLinks().stream()
                .map(b -> BranchStateResponse.builder()
                        .branchId(b.getBranch().getId())
                        .branchName(b.getBranch().getName())
                        .active(b.isActive())
                        .build())
                .collect(Collectors.toList());
    }

    public static ClinicalServiceSummaryResponse toSummary(ClinicalService e) {
        return ClinicalServiceSummaryResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .clinicalServiceCategory(e.getClinicalServiceCategory())
                .description(e.getDescription())
                .price(e.getPrice())
                .branches(mapBranchStates(e))
                .build();
    }

    public static ClinicalServiceResponse toResponse(ClinicalService e) {
        return ClinicalServiceResponse.builder()
                .id(e.getId())
                .name(e.getName())
                .clinicalServiceCategory(e.getClinicalServiceCategory())
                .description(e.getDescription())
                .price(e.getPrice())
                .reminderPeriod(e.getReminderPeriod())
                .reminderPeriodUnit(e.getReminderPeriodUnit())
                .requiredSampleTypes(nonNullImmutableSet(e.getRequiredSampleTypes()))
                .requiredProducts(e.getRequiredProducts() == null
                        ? List.of()
                        : e.getRequiredProducts().stream()
                        .map(p -> ClinicalServiceRequiredProductResponse.builder()
                                .id(p.getId())
                                .name(p.getName())
                                .sku(p.getSku())
                                .build())
                        .collect(Collectors.toList()))
                .branches(mapBranchStates(e))
                .build();
    }

    public static void applyCreate(ClinicalService target, CreateClinicalServiceRequest r) {
        target.setName(r.getName().trim());
        target.setClinicalServiceCategory(r.getClinicalServiceCategory());
        target.setDescription(trimToNull(r.getDescription()));
        target.setPrice(r.getPrice());
        target.setReminderPeriod(r.getReminderPeriod());
        target.setReminderPeriodUnit(r.getReminderPeriodUnit());
        overwriteSampleTypes(target, toSanitizedSet(r.getRequiredSampleTypes()));
    }

    public static void applyUpdate(ClinicalService target, UpdateClinicalServiceRequest r) {
        target.setName(r.getName().trim());
        target.setClinicalServiceCategory(r.getClinicalServiceCategory());
        target.setDescription(trimToNull(r.getDescription()));
        target.setPrice(r.getPrice());
        target.setReminderPeriod(r.getReminderPeriod());
        target.setReminderPeriodUnit(r.getReminderPeriodUnit());
        overwriteSampleTypes(target, toSanitizedSet(r.getRequiredSampleTypes()));
    }

    private static Set<String> toSanitizedSet(Set<String> source) {
        if (source == null || source.isEmpty()) {
            return new HashSet<>();
        }
        return source.stream()
                .map(value -> value == null ? null : value.trim())
                .filter(v -> v != null && !v.isEmpty())
                .collect(Collectors.toCollection(HashSet::new));
    }

    private static Set<String> nonNullImmutableSet(Set<String> source) {
        if (source == null || source.isEmpty()) {
            return Set.of();
        }
        return Set.copyOf(source);
    }

    private static void overwriteSampleTypes(ClinicalService target, Set<String> values) {
        Set<String> current = target.getRequiredSampleTypes();
        if (current == null) {
            target.setRequiredSampleTypes(new HashSet<>(values));
            return;
        }
        current.clear();
        current.addAll(values);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        var trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
