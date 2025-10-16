package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.clinic.enums.AttentionType;
import com.gaedet.biocampovet.core.clinic.enums.AttentionsStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AttentionResponse {

    private final Long id;
    private final Long appointmentId;
    private final BranchResponse branch;
    private final Long animalId;
    private final String animalName;
    private final Long attendingEmployeeId;
    private final String attendingEmployeeFullName;
    private final LocalDateTime checkInTime;
    private final AttentionType type;
    private final boolean emergency;
    private final AttentionsStatus status;
    private final Long clinicalServiceId;
    private final String clinicalServiceName;
}
