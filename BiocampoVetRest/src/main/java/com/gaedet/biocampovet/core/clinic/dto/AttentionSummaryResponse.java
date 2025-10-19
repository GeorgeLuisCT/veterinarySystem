package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.AttentionType;
import com.gaedet.biocampovet.core.clinic.enums.AttentionsStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AttentionSummaryResponse {
    private final Long id;
    private final LocalDateTime checkInTime;
    private final AttentionsStatus status;
    private final AttentionType type;
    private final boolean emergency;

    private final Long animalId;
    private final String animalName;

    private final Long branchId;
    private final String branchName;

    private final Long attendingEmployeeId;
    private final String attendingEmployeeFullName;

    private final Long clinicalServiceId;
    private final String clinicalServiceName;

    private final Long appointmentId;
    private final Long surgicalOrderId;
}
