package com.gaedet.veterinarysystem.core.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportMetric {
    private String key;
    private String label;
    private Double value;
    private String formattedValue;
    private String unit;
    private Double trend;
    private String trendLabel;
}
