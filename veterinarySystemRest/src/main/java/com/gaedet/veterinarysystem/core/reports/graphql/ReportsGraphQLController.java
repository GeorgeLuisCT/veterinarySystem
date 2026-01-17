package com.gaedet.veterinarysystem.core.reports.graphql;

import com.gaedet.veterinarysystem.core.reports.dto.ReportCollection;
import com.gaedet.veterinarysystem.core.reports.dto.ReportFiltersInput;
import com.gaedet.veterinarysystem.core.reports.dto.ReportsDashboard;
import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;
import com.gaedet.veterinarysystem.core.reports.service.ReportFilters;
import com.gaedet.veterinarysystem.core.reports.service.ReportsAggregationService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ReportsGraphQLController {

    private final ReportsAggregationService reportsAggregationService;

    @QueryMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public ReportsDashboard reportsDashboard(@Argument ReportFiltersInput filters) {
        ReportFilters normalized = ReportFilters.fromInput(filters);
        return reportsAggregationService.buildDashboard(normalized);
    }

    @QueryMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_MANAGER')")
    public ReportCollection reportCollection(@Argument ReportModule module,
                                             @Argument ReportFiltersInput filters) {
        ReportFilters normalized = ReportFilters.fromInput(filters);
        return reportsAggregationService.getCollection(module, normalized);
    }
}
