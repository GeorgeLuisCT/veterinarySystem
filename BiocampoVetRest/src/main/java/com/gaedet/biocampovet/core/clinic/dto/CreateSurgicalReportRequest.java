package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.SurgicalReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSurgicalReportRequest {

    @NotNull
    private Long attentionId;

    @NotNull
    private LocalDateTime surgeryStartAt;

    private LocalDateTime surgeryEndAt;

    @NotNull
    private Long surgeonId;

    private Long anesthesiologistId;

    @NotNull
    private Long operatingRoomId;

    private Long assistantId;

    private String monitoring;

    private String findings;

    private String surgicalTechniqueDescription;

    private SurgicalReportStatus status;
}
