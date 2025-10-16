package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.ClinicalAttentionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
@AllArgsConstructor
public class ClinicalAttentionPatchResponse {
    private final Long id;
    private final Long version;
    private final ClinicalAttentionStatus status;
    private final Map<String, Object> updated;
    private final ClinicalAttentionSummaryResponse summary;
}
