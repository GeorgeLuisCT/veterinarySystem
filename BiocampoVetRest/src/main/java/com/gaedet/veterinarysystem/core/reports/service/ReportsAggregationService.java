package com.gaedet.veterinarysystem.core.reports.service;

import com.gaedet.veterinarysystem.core.reports.dto.ReportCollection;
import com.gaedet.veterinarysystem.core.reports.dto.ReportsDashboard;
import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportsAggregationService {

    private final List<ReportDataProvider> providers;

    public ReportsDashboard buildDashboard(ReportFilters filters) {
        List<ReportCollection> collections = providers.stream()
                .sorted(Comparator.comparing(provider -> provider.module().ordinal()))
                .filter(provider -> filters.includesModule(provider.module()))
                .map(provider -> provider.build(filters))
                .toList();

        return ReportsDashboard.builder()
                .generatedAt(OffsetDateTime.now().toString())
                .filters(filters.toState())
                .collections(collections)
                .build();
    }

    public ReportCollection getCollection(ReportModule module, ReportFilters filters) {
        return providers.stream()
                .filter(provider -> provider.module() == module)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No existe un proveedor para " + module))
                .build(filters);
    }
}
