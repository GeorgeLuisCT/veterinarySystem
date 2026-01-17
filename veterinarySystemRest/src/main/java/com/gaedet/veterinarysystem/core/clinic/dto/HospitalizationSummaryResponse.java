package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.AdmissionTiming;
import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationCause;
import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class HospitalizationSummaryResponse {
    private Long id;
    private Long animalId;
    private String animalName;
    private Long cageId;
    private String cageName;
    private Long branchId;
    private String branchName;
    private LocalDateTime admissionDate;
    private HospitalizationStatus status;

    private AdmissionTiming admissionTiming;
    private HospitalizationCause cause;

    private Long clinicalServiceId;
    private String clinicalServiceName;

    private int version;
}

