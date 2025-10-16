package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.branches.dto.BranchStateResponse;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalServiceCategory;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ClinicalServiceSummaryResponse {
    private Long id;
    private String name;
    private ClinicalServiceCategory clinicalServiceCategory;
    private String description;
    private BigDecimal price;
    private List<BranchStateResponse> branches;
}
