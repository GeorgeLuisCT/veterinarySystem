package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.SupplierType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierSummaryResponse {
    private Long id;
    private String name;
    private String ruc;
    private String address;
    private String website;
    private String phone;
    private String email;
    private SupplierType supplierType;
    private String bankName;
    private String bankAccountNumber;
    private Boolean active;
}