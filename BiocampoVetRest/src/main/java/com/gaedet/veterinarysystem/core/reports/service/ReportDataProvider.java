package com.gaedet.veterinarysystem.core.reports.service;

import com.gaedet.veterinarysystem.core.reports.dto.ReportCollection;
import com.gaedet.veterinarysystem.core.reports.enums.ReportModule;

public interface ReportDataProvider {

    ReportModule module();

    ReportCollection build(ReportFilters filters);
}
