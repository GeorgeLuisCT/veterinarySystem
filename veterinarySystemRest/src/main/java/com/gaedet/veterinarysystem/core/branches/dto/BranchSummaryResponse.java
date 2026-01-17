package com.gaedet.veterinarysystem.core.branches.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BranchSummaryResponse {
    private Long id;
    private String name;
}