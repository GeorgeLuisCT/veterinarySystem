package com.gaedet.biocampovet.core.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BranchStockSummary {
    private Long branchId;
    private String branchName;
    private boolean active;
    private Integer stockUnits;
    private Double stockFractional;
}