package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.LabRequestStatus;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;

@Getter @Setter
public class UpdateLabRequestStatusRequest {
    @NotNull
    private LabRequestStatus status;
}