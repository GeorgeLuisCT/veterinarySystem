package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.animal.dto.AnimalBasicResponse;
import com.gaedet.veterinarysystem.core.animal.mapper.AnimalMapper;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.clinic.dto.*;
import com.gaedet.veterinarysystem.core.clinic.entity.Cage;
import com.gaedet.veterinarysystem.core.clinic.entity.EvolutionNote;
import com.gaedet.veterinarysystem.core.clinic.entity.Hospitalization;
import com.gaedet.veterinarysystem.core.clinic.entity.HospitalizationVitalSign;
import com.gaedet.veterinarysystem.core.clinic.entity.TreatmentSchedule;

import java.util.Comparator;
import java.util.Objects;
import java.util.Optional;

public class CageMapper {

    public static CageResponse toResponse(Cage cage, Hospitalization current) {
        CageResponse response = new CageResponse();
        response.setId(cage.getId());
        response.setName(cage.getName());
        response.setSize(cage.getSize());
        response.setOccupied(cage.isOccupied());
        if (cage.getBranch() != null) {
            response.setBranchId(cage.getBranch().getId());
            response.setBranchName(cage.getBranch().getName());
        }

        if (current != null) {
            CageResponse.CurrentHospitalizationBrief brief = new CageResponse.CurrentHospitalizationBrief();

            AnimalBasicResponse animalBasicResponse = AnimalMapper.toBasicResponse(current.getAnimal());

            brief.setId(current.getId());
            brief.setAnimalBasicResponse(animalBasicResponse);
            brief.setStatus(current.getStatus());
            brief.setAdmissionDate(current.getAdmissionDate());
            brief.setAdmissionTiming(current.getAdmissionTiming());
            brief.setCause(current.getCause());
            brief.setClinicalServiceId(current.getClinicalService() != null ? current.getClinicalService().getId() : null);
            brief.setClinicalServiceName(current.getClinicalService() != null ? current.getClinicalService().getName() : null);
            brief.setAttentionId(current.getAttention() != null ? current.getAttention().getId() : null);
            if (current.getVitalSigns() != null && !current.getVitalSigns().isEmpty()) {
                HospitalizationVitalSign latestVitalSign = current.getVitalSigns().get(0);
                brief.setLatestVitalSign(HospitalizationVitalSignMapper.toResponse(latestVitalSign));
            }

            if (current.getTreatmentSchedules() != null && !current.getTreatmentSchedules().isEmpty()) {
                Optional<TreatmentSchedule> nextTreatment = current.getTreatmentSchedules().stream()
                        .filter(schedule -> !schedule.isCompleted())
                        .filter(schedule -> schedule.getScheduledTime() != null)
                        .sorted(Comparator.comparing(TreatmentSchedule::getScheduledTime))
                        .findFirst();
                nextTreatment.ifPresent(schedule ->
                        brief.setNextTreatmentSchedule(toBrief(schedule)));
            }

            if (current.getEvolutionNotes() != null && !current.getEvolutionNotes().isEmpty()) {
                EvolutionNote latestNote = current.getEvolutionNotes().stream()
                        .filter(Objects::nonNull)
                        .filter(note -> note.getTimestamp() != null)
                        .max(Comparator.comparing(EvolutionNote::getTimestamp))
                        .orElse(current.getEvolutionNotes().get(0));
                brief.setLatestEvolutionNote(EvolutionNoteMapper.toResponse(latestNote));
            }

            response.setCurrentHospitalization(brief);
        }

        return response;
    }

    public static Cage toEntity(CageRequest request, Branch branch) {
        Cage cage = new Cage();
        cage.setName(request.getName());
        cage.setSize(request.getSize());
        cage.setBranch(branch);
        cage.setOccupied(false);
        return cage;
    }

    private static TreatmentScheduleBriefResponse toBrief(TreatmentSchedule schedule) {
        TreatmentScheduleBriefResponse brief = new TreatmentScheduleBriefResponse();
        brief.setId(schedule.getId());
        brief.setTreatmentName(schedule.getTreatmentName());
        brief.setScheduledTime(schedule.getScheduledTime());
        brief.setCompleted(schedule.isCompleted());
        return brief;
    }
}
