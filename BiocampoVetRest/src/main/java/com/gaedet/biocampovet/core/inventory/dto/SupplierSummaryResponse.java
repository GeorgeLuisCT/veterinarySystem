package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.SupplierType;

public record SupplierSummaryResponse(
        Long id,
        String name,
        String ruc,
        String contactPhone,
        String email,
        SupplierType supplierType,
        boolean active
) {
    public static SupplierSummaryResponse fromNativeRow(Object[] row) {
        return new SupplierSummaryResponse(
                ((Number) row[0]).longValue(),      // id
                (String) row[1],                    // name
                (String) row[2],                    // ruc
                (String) row[3],                    // contactPhone
                (String) row[4],                    // email
                SupplierType.valueOf((String) row[5]), // supplierType
                row[6] != null && (boolean) row[6]  // active
        );
    }
}