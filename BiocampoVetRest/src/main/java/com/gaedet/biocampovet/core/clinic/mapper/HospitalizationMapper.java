package com.gaedet.biocampovet.core.clinic.mapper;

import com.gaedet.biocampovet.core.clinic.dto.HospitalizationResponse;
import com.gaedet.biocampovet.core.clinic.dto.HospitalizationSummaryResponse;
import com.gaedet.biocampovet.core.clinic.entity.Hospitalization;
import com.gaedet.biocampovet.core.clinic.entity.HospitalizationVitalSign;

import java.util.Comparator;
import java.util.stream.Collectors;

public class HospitalizationMapper {

    public static HospitalizationResponse toResponse(Hospitalization h) {
        HospitalizationResponse r = new HospitalizationResponse();
        r.setId(h.getId());
        r.setVersion(h.getVersion());
        r.setAdmissionDate(h.getAdmissionDate());
        r.setDischargeDate(h.getDischargeDate());
        r.setAdmissionNotes(h.getAdmissionNotes());
        r.setStatus(h.getStatus());
        r.setAdmissionTiming(h.getAdmissionTiming());
        r.setCause(h.getCause());

        if (h.getAnimal() != null) {
            r.setAnimalId(h.getAnimal().getId());
            r.setAnimalName(h.getAnimal().getName());
        }
        if (h.getCage() != null) {
            r.setCageId(h.getCage().getId());
            r.setCageName(h.getCage().getName());
        }
        if (h.getAttention() != null) {
            r.setAttentionId(h.getAttention().getId());
        }
        if (h.getClinicalService() != null) {
            r.setClinicalServiceId(h.getClinicalService().getId());
            r.setClinicalServiceName(h.getClinicalService().getName());
        }

        if (h.getEvolutionNotes() != null) {
            r.setEvolutionNotes(
                    h.getEvolutionNotes().stream()
                            .map(EvolutionNoteMapper::toResponse)
                            .collect(Collectors.toList())
            );
        }

        if (h.getTreatmentSchedules() != null) {
            r.setTreatmentSchedules(
                    h.getTreatmentSchedules().stream()
                            .map(TreatmentScheduleMapper::toResponse)
                            .collect(Collectors.toList())
            );
        }

        if (h.getVitalSigns() != null) {
            r.setVitalSigns(
                    h.getVitalSigns().stream()
                            .sorted(Comparator.comparing(HospitalizationVitalSign::getRecordedAt,
                                    Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                            .map(HospitalizationVitalSignMapper::toResponse)
                            .collect(Collectors.toList())
            );
        }

        return r;
    }

    public static HospitalizationSummaryResponse toSummaryResponse(Hospitalization h) {
        return HospitalizationSummaryResponse.builder()
                .id(h.getId())
                .animalId(h.getAnimal().getId())
                .animalName(h.getAnimal().getName())
                .cageId(h.getCage().getId())
                .cageName(h.getCage().getName())
                .branchId(h.getCage().getBranch().getId())
                .branchName(h.getCage().getBranch().getName())
                .admissionDate(h.getAdmissionDate())
                .status(h.getStatus())
                .admissionTiming(h.getAdmissionTiming())
                .cause(h.getCause())
                .clinicalServiceId(h.getClinicalService() != null ? h.getClinicalService().getId() : null)
                .clinicalServiceName(h.getClinicalService() != null ? h.getClinicalService().getName() : null)
                .version(h.getVersion())
                .build();
    }
}
