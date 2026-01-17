package com.gaedet.veterinarysystem.core.fieltd.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class FieldVisitResponse extends FieldVisitSummaryResponse {
    private List<FieldVisitServiceItemResponse> serviceItems;
    private List<FieldVisitProductUsageResponse> productUsages;
    private FieldVisitBiosecurityResponse biosecurity;
    private List<FieldVisitAttachmentResponse> attachments;
    private FieldVisitReportResponse report;
}
