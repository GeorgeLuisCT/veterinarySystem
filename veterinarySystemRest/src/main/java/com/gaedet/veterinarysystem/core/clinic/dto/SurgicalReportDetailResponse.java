package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class SurgicalReportDetailResponse {

    private final Long id;
    private final Long version;
    private final Long attentionId;
    private final Long surgicalOrderId;
    private final SurgicalReportStatus status;
    private final LocalDateTime surgeryStartAt;
    private final LocalDateTime surgeryEndAt;
    private final Long surgeonId;
    private final String surgeonFullName;
    private final Long anesthesiologistId;
    private final String anesthesiologistFullName;
    private final Long assistantId;
    private final String assistantFullName;
    private final Long operatingRoomId;
    private final String operatingRoomName;
    private final String monitoring;
    private final String findings;
    private final String surgicalTechniqueDescription;
    private final SurgicalReportSummaryResponse summary;
    private final List<AnestheticDrugResponse> anestheticProtocol;
    private final List<SurgicalMaterialResponse> materialsUsed;
    private final List<PostOperativeIndicationResponse> postOperativeIndications;
}
