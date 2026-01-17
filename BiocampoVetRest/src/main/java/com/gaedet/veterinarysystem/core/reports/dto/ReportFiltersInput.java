package com.gaedet.veterinarysystem.core.reports.dto;

import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;
import lombok.Data;

import java.util.List;

@Data
public class ReportFiltersInput {
    private String from;
    private String to;
    private List<Long> branchIds;
    private List<Long> employeeIds;
    private List<Long> customerIds;
    private List<Long> animalIds;
    private List<Long> zoneIds;
    private List<String> statuses;
    private List<String> species;
    private List<ReportModule> modules;
    private Boolean includeVoided;
    private String search;
}
