package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationCause;
import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationStatus;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Getter
@Setter
public class UpdateHospitalizationRequest {
    @NotNull
    private Integer version;

    private LocalDateTime dischargeDate;
    private String admissionNotes;
    private HospitalizationStatus status;

    private HospitalizationCause cause;
    private Long clinicalServiceId;
}

