package com.gaedet.veterinarysystem.core.reports.dto;

import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;
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
public class ReportFilterState {
    private String from;
    private String to;
    @Builder.Default
    private List<Long> branchIds = new ArrayList<>();
    @Builder.Default
    private List<Long> employeeIds = new ArrayList<>();
    @Builder.Default
    private List<Long> customerIds = new ArrayList<>();
    @Builder.Default
    private List<Long> animalIds = new ArrayList<>();
    @Builder.Default
    private List<Long> zoneIds = new ArrayList<>();
    @Builder.Default
    private List<String> statuses = new ArrayList<>();
    @Builder.Default
    private List<String> species = new ArrayList<>();
    @Builder.Default
    private List<ReportModule> modules = new ArrayList<>();
    private boolean includeVoided;
    private String search;
}
