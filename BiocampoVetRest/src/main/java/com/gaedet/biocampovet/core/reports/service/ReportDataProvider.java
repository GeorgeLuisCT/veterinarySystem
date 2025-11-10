package com.gaedet.biocampovet.core.reports.service;

import com.gaedet.biocampovet.core.reports.dto.ReportCollection;
import com.gaedet.biocampovet.core.reports.enums.ReportModule;

public interface ReportDataProvider {

    ReportModule module();

    ReportCollection build(ReportFilters filters);
}
