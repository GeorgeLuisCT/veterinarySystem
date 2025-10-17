package com.gaedet.biocampovet.core.branches.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LaboratoryResponse {

    private final Long id;
    private final String name;
    private final Long branchId;
    private final String branchName;
    private final String contactName;
    private final String contactPhone;
    private final String contactEmail;
    private final String notes;
}
