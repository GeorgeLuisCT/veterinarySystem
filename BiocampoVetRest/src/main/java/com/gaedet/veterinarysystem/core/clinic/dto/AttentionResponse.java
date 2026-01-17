package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.animal.dto.AnimalBasicResponse;
import com.gaedet.veterinarysystem.core.branches.dto.BranchResponse;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionType;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionsStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AttentionResponse {

    private final Long id;
    private final Long appointmentId;
    private final BranchResponse branch;
    private final AnimalBasicResponse animalBasicResponse;
    private final Long attendingEmployeeId;
    private final String attendingEmployeeFullName;
    private final LocalDateTime checkInTime;
    private final AttentionType type;
    private final boolean emergency;
    private final AttentionsStatus status;
    private final Long clinicalServiceId;
    private final String clinicalServiceName;
}
