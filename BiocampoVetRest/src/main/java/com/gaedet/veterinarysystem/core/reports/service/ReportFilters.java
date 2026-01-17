package com.gaedet.veterinarysystem.core.reports.service;

import com.gaedet.veterinarysystem.core.reports.dto.ReportFilterState;
import com.gaedet.veterinarysystem.core.reports.dto.ReportFiltersInput;
import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
public class ReportFilters {

    private final LocalDateTime from;
    private final LocalDateTime to;
    @Builder.Default
    private final Set<Long> branchIds = new LinkedHashSet<>();
    @Builder.Default
    private final Set<Long> employeeIds = new LinkedHashSet<>();
    @Builder.Default
    private final Set<Long> customerIds = new LinkedHashSet<>();
    @Builder.Default
    private final Set<Long> animalIds = new LinkedHashSet<>();
    @Builder.Default
    private final Set<Long> zoneIds = new LinkedHashSet<>();
    @Builder.Default
    private final Set<String> statuses = new LinkedHashSet<>();
    @Builder.Default
    private final Set<String> species = new LinkedHashSet<>();
    @Builder.Default
    private final Set<ReportModule> modules = EnumSet.allOf(ReportModule.class);
    private final boolean includeVoided;
    private final String search;

    public static ReportFilters fromInput(ReportFiltersInput input) {
        LocalDateTime now = LocalDateTime.now(ZoneId.systemDefault());
        LocalDateTime parsedTo = parseDateTime(input != null ? input.getTo() : null).orElse(now);
        LocalDateTime parsedFrom = parseDateTime(input != null ? input.getFrom() : null)
                .orElse(parsedTo.minusDays(30));

        if (parsedFrom.isAfter(parsedTo)) {
            LocalDateTime swap = parsedFrom;
            parsedFrom = parsedTo;
            parsedTo = swap;
        }

        return ReportFilters.builder()
                .from(parsedFrom.withHour(0).withMinute(0).withSecond(0).withNano(0))
                .to(parsedTo.withHour(23).withMinute(59).withSecond(59).withNano(999_000_000))
                .branchIds(toIds(input != null ? input.getBranchIds() : null))
                .employeeIds(toIds(input != null ? input.getEmployeeIds() : null))
                .customerIds(toIds(input != null ? input.getCustomerIds() : null))
                .animalIds(toIds(input != null ? input.getAnimalIds() : null))
                .zoneIds(toIds(input != null ? input.getZoneIds() : null))
                .statuses(toUpperSet(input != null ? input.getStatuses() : null))
                .species(toUpperSet(input != null ? input.getSpecies() : null))
                .modules(toModules(input != null ? input.getModules() : null))
                .includeVoided(input != null && Boolean.TRUE.equals(input.getIncludeVoided()))
                .search(input != null ? trimToNull(input.getSearch()) : null)
                .build();
    }

    public boolean includesModule(ReportModule module) {
        return modules == null || modules.isEmpty() || modules.contains(module);
    }

    public ReportFilterState toState() {
        return ReportFilterState.builder()
                .from(from != null ? from.toString() : null)
                .to(to != null ? to.toString() : null)
                .branchIds(new ArrayList<>(branchIds))
                .employeeIds(new ArrayList<>(employeeIds))
                .customerIds(new ArrayList<>(customerIds))
                .animalIds(new ArrayList<>(animalIds))
                .zoneIds(new ArrayList<>(zoneIds))
                .statuses(new ArrayList<>(statuses))
                .species(new ArrayList<>(species))
                .modules(modules == null ? new ArrayList<>() : new ArrayList<>(modules))
                .includeVoided(includeVoided)
                .search(search)
                .build();
    }

    private static LinkedHashSet<Long> toIds(List<Long> values) {
        if (values == null) {
            return new LinkedHashSet<>();
        }
        return values.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static LinkedHashSet<String> toUpperSet(List<String> values) {
        if (values == null) {
            return new LinkedHashSet<>();
        }
        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.toUpperCase().replace(' ', '_'))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static EnumSet<ReportModule> toModules(List<ReportModule> values) {
        if (values == null || values.isEmpty()) {
            return EnumSet.allOf(ReportModule.class);
        }
        return EnumSet.copyOf(values);
    }

    private static java.util.Optional<LocalDateTime> parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return java.util.Optional.empty();
        }
        try {
            return java.util.Optional.of(OffsetDateTime.parse(value).toLocalDateTime());
        } catch (DateTimeParseException ignored) {
        }
        try {
            return java.util.Optional.of(LocalDateTime.parse(value));
        } catch (DateTimeParseException ignored) {
        }
        try {
            LocalDate date = LocalDate.parse(value);
            return java.util.Optional.of(date.atStartOfDay());
        } catch (DateTimeParseException ignored) {
        }
        return java.util.Optional.empty();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
