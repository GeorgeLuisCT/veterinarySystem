package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.animal.dto.AnimalBasicResponse;
import com.gaedet.veterinarysystem.core.clinic.enums.AdmissionTiming;
import com.gaedet.veterinarysystem.core.clinic.enums.CageSize;
import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationCause;
import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CageResponse {
    private Long id;
    private String name;
    private CageSize size;
    private boolean isOccupied;
    private Long branchId;
    private String branchName;

    private CurrentHospitalizationBrief currentHospitalization;

    @Getter
    @Setter
    public static class CurrentHospitalizationBrief {
        private Long id;
        private AnimalBasicResponse animalBasicResponse;
        private HospitalizationStatus status;
        private LocalDateTime admissionDate;

        private AdmissionTiming admissionTiming;
        private HospitalizationCause cause;

        private Long clinicalServiceId;
        private String clinicalServiceName;

        private Long attentionId;

        private HospitalizationVitalSignResponse latestVitalSign;
        private TreatmentScheduleBriefResponse nextTreatmentSchedule;
        private EvolutionNoteResponse latestEvolutionNote;
    }
}
