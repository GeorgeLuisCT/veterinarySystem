package com.gaedet.veterinarysystem.core.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class LaboratoryRequestDetailResponse extends LaboratoryRequestSummaryResponse {
    private String clinicalNotes;
    private List<LaboratoryRequestItemResponse> items;
}
