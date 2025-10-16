package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.SurgicalOrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SurgicalOrderSummaryResponse {

    private final Long id;
    private final Long recommendedServiceId;
    private final String recommendedServiceName;
    private final SurgicalOrderStatus status;
    private final String notes;
    private final LocalDateTime createdAt;
}
