package com.gaedet.biocampovet.core.clinic.dto.reminder;

import com.gaedet.biocampovet.core.clinic.enums.ReminderStatus;
import com.gaedet.biocampovet.core.clinic.enums.ReminderType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class ReminderQueryFilters {
    private final String query;
    private final List<ReminderType> types;
    private final List<ReminderStatus> statuses;
    private final LocalDate dueFrom;
    private final LocalDate dueTo;
    private final boolean includeManual;
    private final boolean includeAutomatic;
}
