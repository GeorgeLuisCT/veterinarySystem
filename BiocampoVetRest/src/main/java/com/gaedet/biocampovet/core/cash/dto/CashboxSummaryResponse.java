package com.gaedet.biocampovet.core.cash.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;

public record CashboxSummaryResponse(
        Long id,
        String branchName,
        LocalDateTime openedAt,
        LocalDateTime closedAt,
        String openedByFullName,
        String closedByFullName,
        String status,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal physicalAmount
) {
    public static CashboxSummaryResponse fromNativeRow(Object[] row) {
        return new CashboxSummaryResponse(
                ((Number) row[0]).longValue(),
                (String) row[1],
                ((Timestamp) row[2]).toLocalDateTime(),
                row[3] != null ? ((Timestamp) row[3]).toLocalDateTime() : null,
                (String) row[4],
                (String) row[5],
                (String) row[6],
                (BigDecimal) row[7],
                (BigDecimal) row[8],
                (BigDecimal) row[9]
        );
    }
}
