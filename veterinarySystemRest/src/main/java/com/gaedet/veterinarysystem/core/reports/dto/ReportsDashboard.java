package com.gaedet.veterinarysystem.core.reports.dto;

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
public class ReportsDashboard {
    private String generatedAt;
    private ReportFilterState filters;
    @Builder.Default
    private List<ReportCollection> collections = new ArrayList<>();
}
