package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.GroomingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
@AllArgsConstructor
public class GroomingSessionPatchResponse {
    private final Long id;
    private final Long version;
    private final GroomingStatus status;
    private final Map<String, Object> updated;
    private final GroomingSessionSummaryResponse summary;
}
