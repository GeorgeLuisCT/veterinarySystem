package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.SurgicalReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.openapitools.jackson.nullable.JsonNullable;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSurgicalReportRequest {

    private Long version;
    private JsonNullable<LocalDateTime> surgeryStartAt;
    private JsonNullable<LocalDateTime> surgeryEndAt;
    private JsonNullable<Long> surgeonId;
    private JsonNullable<Long> anesthesiologistId;
    private JsonNullable<Long> operatingRoomId;
    private JsonNullable<Long> assistantId;
    private JsonNullable<SurgicalReportStatus> status;
    private JsonNullable<String> monitoring;
    private JsonNullable<String> findings;
    private JsonNullable<String> surgicalTechniqueDescription;
}
