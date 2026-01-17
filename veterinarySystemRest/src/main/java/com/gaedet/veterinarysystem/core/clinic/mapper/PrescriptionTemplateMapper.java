package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.clinic.dto.*;
import com.gaedet.veterinarysystem.core.clinic.entity.PrescriptionTemplate;
import com.gaedet.veterinarysystem.core.clinic.entity.PrescriptionTemplateMedication;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class PrescriptionTemplateMapper {

    private PrescriptionTemplateMapper() {
    }

    public static PrescriptionTemplateSummaryResponse toSummary(PrescriptionTemplate template) {
        int count = template.getMedications() == null ? 0 : template.getMedications().size();
        return PrescriptionTemplateSummaryResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .purpose(template.getPurpose())
                .medicationCount(count)
                .build();
    }

    public static PrescriptionTemplateResponse toResponse(PrescriptionTemplate template) {
        List<PrescriptionTemplateMedicationResponse> medications = template.getMedications() == null
                ? List.of()
                : template.getMedications().stream()
                .filter(Objects::nonNull)
                .map(PrescriptionTemplateMapper::toMedicationResponse)
                .collect(Collectors.toList());

        return PrescriptionTemplateResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .purpose(template.getPurpose())
                .notes(template.getNotes())
                .medications(medications)
                .build();
    }

    public static PrescriptionTemplateMedicationResponse toMedicationResponse(PrescriptionTemplateMedication medication) {
        return PrescriptionTemplateMedicationResponse.builder()
                .id(medication.getId())
                .productId(medication.getProduct() != null ? medication.getProduct().getId() : null)
                .productName(medication.getProduct() != null ? medication.getProduct().getName() : null)
                .customMedicationName(medication.getCustomMedicationName())
                .dosageAmount(medication.getDosageAmount())
                .dosageUnit(medication.getDosageUnit())
                .frequencyValue(medication.getFrequencyValue())
                .frequencyUnit(medication.getFrequencyUnit())
                .durationValue(medication.getDurationValue())
                .durationUnit(medication.getDurationUnit())
                .instructions(medication.getInstructions())
                .build();
    }

    public static void applyCreate(PrescriptionTemplate target, CreatePrescriptionTemplateRequest request) {
        target.setName(trimmed(request.getName()));
        target.setPurpose(trimmed(request.getPurpose()));
        target.setNotes(trimToNull(request.getNotes()));
    }

    public static void applyUpdate(PrescriptionTemplate target, UpdatePrescriptionTemplateRequest request) {
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
