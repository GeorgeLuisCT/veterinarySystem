package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.animal.dto.AnimalBasicResponse;
import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalAttentionStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ClinicalAttentionSummaryResponse {

    private final Long id;
    private final Long version;
    private final Long attentionId;
    private final ClinicalAttentionStatus status;
    private final LocalDateTime visitDate;
    private final AnimalBasicResponse animalBasicResponse;
    private final String clinicalServiceName;
    private final BranchResponse branch;
    private final Long attendingEmployeeId;
    private final String attendingEmployeeFullName;
}
