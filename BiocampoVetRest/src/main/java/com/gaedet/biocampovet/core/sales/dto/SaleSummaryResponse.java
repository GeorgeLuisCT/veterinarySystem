package com.gaedet.biocampovet.core.sales.dto;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;

public record SaleSummaryResponse(
        Long id,
        String employeeFullName,
        String customerName,
        LocalDateTime saleDate,
        BigDecimal totalProducts,
        BigDecimal totalServices,
        BigDecimal totalProcedures,
        BigDecimal totalAmount,
        BigDecimal totalPaid,
        String status
) {
    public static SaleSummaryResponse fromNativeRow(Object[] row) {
        return new SaleSummaryResponse(
                ((Number) row[0]).longValue(),
                (String) row[1],
                (String) row[2],
                ((Timestamp) row[3]).toLocalDateTime(),
                ((BigDecimal) row[4]),
                ((BigDecimal) row[5]),
                ((BigDecimal) row[6]),
                ((BigDecimal) row[7]),
                ((BigDecimal) row[8]),
                (String) row[9]
        );
    }
}
