package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.AdmissionTiming;
import com.gaedet.biocampovet.core.clinic.enums.HospitalizationCause;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Getter
@Setter
public class CreateHospitalizationRequest {
    @NotNull
    private Long animalId;
    @NotNull
    private Long cageId;

    private Long attentionId;

    @NotNull
    private AdmissionTiming admissionTiming;

    private HospitalizationCause cause;

    private Long clinicalServiceId;

    @NotBlank
    private String admissionNotes;
}
