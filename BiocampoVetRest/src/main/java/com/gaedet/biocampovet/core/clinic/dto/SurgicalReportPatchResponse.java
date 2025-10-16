package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.SurgicalReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
@AllArgsConstructor
public class SurgicalReportPatchResponse {
    private final Long id;
    private final Long version;
    private final SurgicalReportStatus status;
    private final Map<String, Object> updated;
    private final SurgicalReportSummaryResponse summary;
}
