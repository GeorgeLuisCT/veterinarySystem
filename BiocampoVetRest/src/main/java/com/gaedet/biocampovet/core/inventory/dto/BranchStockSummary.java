package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BranchStockSummary {
    private Long branchId;
    private String branchName;
    private boolean active;

    private BigDecimal stockMainUnit;
    private BigDecimal stockBaseUnitRemainder;
}