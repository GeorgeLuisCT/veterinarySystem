package com.gaedet.biocampovet.core.reports.service;

import com.gaedet.biocampovet.core.reports.dto.ReportCollection;
import com.gaedet.biocampovet.core.reports.enums.ReportModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportsAggregationServiceTest {

    @Mock
    private ReportDataProvider salesProvider;

    @Mock
    private ReportDataProvider clinicProvider;

    private ReportsAggregationService service;

    @BeforeEach
    void setUp() {
        service = new ReportsAggregationService(List.of(salesProvider, clinicProvider));
        when(salesProvider.module()).thenReturn(ReportModule.SALES);
        when(clinicProvider.module()).thenReturn(ReportModule.CLINIC);
    }

    @Test
    void shouldReturnCollectionsForRequestedModules() {
        ReportFilters filters = ReportFilters.fromInput(null);

        when(salesProvider.build(filters))
                .thenReturn(ReportCollection.builder().module(ReportModule.SALES).title("Sales").build());
        when(clinicProvider.build(filters))
                .thenReturn(ReportCollection.builder().module(ReportModule.CLINIC).title("Clinic").build());

        var dashboard = service.buildDashboard(filters);

        assertThat(dashboard.getCollections()).hasSize(2);
        assertThat(dashboard.getCollections().get(0).getModule()).isEqualTo(ReportModule.SALES);
    }

    @Test
    void shouldFilterModulesWhenRequested() {
        ReportFiltersInputStub input = new ReportFiltersInputStub();
        ReportFilters scoped = ReportFilters.fromInput(input.onlySales());

        when(salesProvider.build(scoped))
                .thenReturn(ReportCollection.builder().module(ReportModule.SALES).title("Sales").build());

        var dashboard = service.buildDashboard(scoped);

        assertThat(dashboard.getCollections()).hasSize(1);
        assertThat(dashboard.getCollections().get(0).getModule()).isEqualTo(ReportModule.SALES);
    }

    private static class ReportFiltersInputStub extends com.gaedet.biocampovet.core.reports.dto.ReportFiltersInput {
        ReportFiltersInputStub onlySales() {
            setModules(List.of(ReportModule.SALES));
            return this;
        }
    }
}
