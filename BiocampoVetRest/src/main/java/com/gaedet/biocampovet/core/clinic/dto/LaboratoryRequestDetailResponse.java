package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.entity.LaboratoryRequest;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class LaboratoryRequestDetailResponse extends LaboratoryRequestSummaryResponse {
    private String clinicalNotes;
    private List<LaboratoryRequestItemResponse> items;
}
