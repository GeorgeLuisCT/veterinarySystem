package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.ClinicalAttentionStatus;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ClinicalAttentionStatusGroupResponse {

    private final ClinicalAttentionStatus status;
    private final List<ClinicalAttentionSummaryResponse> attentions;
}
