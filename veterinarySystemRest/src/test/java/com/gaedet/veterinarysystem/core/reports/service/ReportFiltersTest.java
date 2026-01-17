package com.gaedet.veterinarysystem.core.reports.service;

import com.gaedet.veterinarysystem.core.reports.dto.ReportFiltersInput;
import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ReportFiltersTest {

    @Test
    void shouldDefaultThirtyDayWindowWhenNoDatesProvided() {
        ReportFilters filters = ReportFilters.fromInput(null);

        assertThat(filters.getTo()).isNotNull();
        assertThat(filters.getFrom()).isNotNull();
        assertThat(Duration.between(filters.getFrom(), filters.getTo()).toDays()).isGreaterThanOrEqualTo(29);
        assertThat(filters.getModules()).contains(ReportModule.SALES, ReportModule.CLINIC);
    }

    @Test
    void shouldRespectExplicitFilters() {
        ReportFiltersInput input = new ReportFiltersInput();
        input.setFrom("2024-01-01T00:00:00");
        input.setTo("2024-01-31T23:59:59");
        input.setBranchIds(List.of(1L, 2L));
        input.setStatuses(List.of("completed", "draft"));
        input.setModules(List.of(ReportModule.SALES, ReportModule.FINANCE));

        ReportFilters filters = ReportFilters.fromInput(input);

        assertThat(filters.getBranchIds()).containsExactlyInAnyOrder(1L, 2L);
        assertThat(filters.getStatuses()).containsExactly("COMPLETED", "DRAFT");
        assertThat(filters.getModules()).containsOnly(ReportModule.SALES, ReportModule.FINANCE);
        assertThat(filters.getFrom()).isEqualTo(LocalDateTime.parse("2024-01-01T00:00"));
    }
}
