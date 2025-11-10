package com.gaedet.biocampovet.core.reports.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportBreakdownGroup {
    private String key;
    private String title;
    private String subtitle;
    @Builder.Default
    private List<ReportBreakdownItem> items = new ArrayList<>();
}
