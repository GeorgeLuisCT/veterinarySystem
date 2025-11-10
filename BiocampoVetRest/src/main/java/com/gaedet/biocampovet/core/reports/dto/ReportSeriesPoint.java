package com.gaedet.biocampovet.core.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportSeriesPoint {
    private String key;
    private String label;
    private Double value;
}
