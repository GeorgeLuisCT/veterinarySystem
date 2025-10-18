package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.AdmissionTiming;
import com.gaedet.biocampovet.core.clinic.enums.HospitalizationCause;
import com.gaedet.biocampovet.core.clinic.enums.HospitalizationStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CageResponse {
    private Long id;
    private String name;
    private String size;
    private boolean isOccupied;
    private Long branchId;
    private String branchName;

    private CurrentHospitalizationBrief currentHospitalization;

    @Getter
    @Setter
    public static class CurrentHospitalizationBrief {
        private Long id;
        private Long animalId;
        private String animalName;

        private HospitalizationStatus status;
        private LocalDateTime admissionDate;

        private AdmissionTiming admissionTiming;
        private HospitalizationCause cause;

        private Long clinicalServiceId;
        private String clinicalServiceName;

        private Long attentionId;
    }
}
