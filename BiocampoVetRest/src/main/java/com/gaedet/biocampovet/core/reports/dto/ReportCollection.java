package com.gaedet.biocampovet.core.reports.dto;

import com.gaedet.biocampovet.core.reports.enums.ReportModule;
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
public class ReportCollection {
    private ReportModule module;
    private String title;
    private String description;
    @Builder.Default
    private List<ReportMetric> metrics = new ArrayList<>();
    @Builder.Default
    private List<ReportBreakdownGroup> breakdowns = new ArrayList<>();
    @Builder.Default
    private List<ReportSeriesPoint> timeline = new ArrayList<>();
}
