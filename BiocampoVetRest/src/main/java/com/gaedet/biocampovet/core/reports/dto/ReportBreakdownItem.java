package com.gaedet.biocampovet.core.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportBreakdownItem {
    private String key;
    private String label;
    @Builder.Default
    private List<KeyValuePair> metadata = new ArrayList<>();
    private Double value;
    private String formattedValue;
    private String unit;
    private Double percentage;
    private Double trend;
}
