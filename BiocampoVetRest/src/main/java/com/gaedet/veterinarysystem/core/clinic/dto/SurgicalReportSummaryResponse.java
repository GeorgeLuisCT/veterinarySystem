package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.animal.dto.AnimalBasicResponse;
import com.gaedet.veterinarysystem.core.branches.dto.BranchResponse;
import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalReportStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SurgicalReportSummaryResponse {

    private final Long id;
    private final Long version;
    private final Long attentionId;
    private final LocalDateTime surgeryStartAt;
    private final LocalDateTime surgeryEndAt;
    private final SurgicalReportStatus status;
    private final AnimalBasicResponse animalBasicResponse;
    private final String clinicalServiceName;
    private final BranchResponse branch;
    private final Long surgeonId;
    private final String surgeonFullName;
    private final Long anesthesiologistId;
    private final String anesthesiologistFullName;
    private final Long assistantId;
    private final String assistantFullName;
    private final Long operatingRoomId;
    private final String operatingRoomName;
}
