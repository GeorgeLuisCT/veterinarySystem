package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.AdmissionTiming;
import com.gaedet.biocampovet.core.clinic.enums.HospitalizationCause;
import com.gaedet.biocampovet.core.clinic.enums.HospitalizationStatus;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class HospitalizationResponse {
    private Long id;
    private Long animalId;
    private String animalName;
    private Long cageId;
    private String cageName;

    private Long attentionId;

    private Long clinicalServiceId;
    private String clinicalServiceName;

    private AdmissionTiming admissionTiming;
    private HospitalizationCause cause;

    private LocalDateTime admissionDate;
    private LocalDateTime dischargeDate;

    private String admissionNotes;

    private HospitalizationStatus status;
    private List<EvolutionNoteResponse> evolutionNotes;
    private List<TreatmentScheduleResponse> treatmentSchedules;
    private int version;
}
