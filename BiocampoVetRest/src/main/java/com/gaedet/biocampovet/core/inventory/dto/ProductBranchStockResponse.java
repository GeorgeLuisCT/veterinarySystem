package com.gaedet.biocampovet.core.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductBranchStockResponse {
    private Long id;
    private Long branchId;
    private String branchName;
    private Integer stockUnits;
    private Double stockFractional;
}
