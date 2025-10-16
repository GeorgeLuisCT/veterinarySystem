package com.gaedet.biocampovet.core.clinic.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SurgicalAppointmentDetailResponse {
    private final Long orderId;
    private final Long finalServiceId;
    private final String finalServiceName;
    private final Long surgeonId;
    private final String surgeonFullName;
    private final Long anesthetistId;
    private final String anesthetistFullName;
    private final Long operatingRoomId;
    private final String operatingRoomName;
    private final String prepInstructions;
}
