package com.gaedet.biocampovet.core.inventory.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;

public record InventoryMovementSummaryResponse(
        Long id,
        String type,
        String sourceBranch,
        String targetBranch,
        String supplierName,
        LocalDateTime date,
        int productCount,
        BigDecimal totalCost
) {
    public static InventoryMovementSummaryResponse fromNativeRow(Object[] row) {
        Timestamp timestamp = (Timestamp) row[5];
        LocalDateTime date = timestamp.toLocalDateTime();

        return new InventoryMovementSummaryResponse(
                ((Number) row[0]).longValue(),       // id
                (String) row[1],                     // type
                (String) row[2],                     // sourceBranch
                (String) row[3],                     // targetBranch
                (String) row[4],                     // supplierName
                date,                                // date
                ((Number) row[6]).intValue(),        // productCount
                new BigDecimal(row[7].toString())    // totalCost
        );
    }
}