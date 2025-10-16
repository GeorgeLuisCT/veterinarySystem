package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.global.enums.TimeUnit;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ClinicalServiceResponse extends ClinicalServiceSummaryResponse {
    private Integer reminderPeriod;
    private TimeUnit reminderPeriodUnit;
    private Set<String> requiredSampleTypes;
    private List<ClinicalServiceRequiredProductResponse> requiredProducts;
}
