package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.InventoryMovementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovementSummaryResponse {
    private Long id;
    private InventoryMovementType type;
    private LocalDateTime date;
    private String sourceBranchName;
    private String targetBranchName;
    private String supplierName;
    private String employeeName;
    private String description;
}