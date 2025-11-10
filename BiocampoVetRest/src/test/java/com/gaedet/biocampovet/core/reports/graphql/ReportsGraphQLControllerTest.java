package com.gaedet.biocampovet.core.reports.graphql;

import com.gaedet.biocampovet.core.reports.dto.ReportCollection;
import com.gaedet.biocampovet.core.reports.dto.ReportFiltersInput;
import com.gaedet.biocampovet.core.reports.dto.ReportsDashboard;
import com.gaedet.biocampovet.core.reports.enums.ReportModule;
import com.gaedet.biocampovet.core.reports.service.ReportFilters;
import com.gaedet.biocampovet.core.reports.service.ReportsAggregationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportsGraphQLControllerTest {

    @Mock
    private ReportsAggregationService aggregationService;

    private ReportsGraphQLController controller;

    @BeforeEach
    void setUp() {
        controller = new ReportsGraphQLController(aggregationService);
    }

    @Test
    void shouldDelegateDashboardQuery() {
        ReportsDashboard dashboard = ReportsDashboard.builder().generatedAt("now").build();
        when(aggregationService.buildDashboard(org.mockito.Mockito.any())).thenReturn(dashboard);

        ReportsDashboard result = controller.reportsDashboard(new ReportFiltersInput());

        assertThat(result).isSameAs(dashboard);
        verify(aggregationService).buildDashboard(org.mockito.Mockito.any(ReportFilters.class));
    }

    @Test
    void shouldDelegateSingleCollectionQuery() {
        ReportCollection collection = ReportCollection.builder().module(ReportModule.SALES).build();
        when(aggregationService.getCollection(eq(ReportModule.SALES), org.mockito.Mockito.any())).thenReturn(collection);

        ReportCollection result = controller.reportCollection(ReportModule.SALES, new ReportFiltersInput());

        assertThat(result).isSameAs(collection);
        ArgumentCaptor<ReportFilters> filters = ArgumentCaptor.forClass(ReportFilters.class);
        verify(aggregationService).getCollection(eq(ReportModule.SALES), filters.capture());
        assertThat(filters.getValue()).isNotNull();
    }
}
