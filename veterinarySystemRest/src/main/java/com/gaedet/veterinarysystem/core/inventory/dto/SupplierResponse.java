package com.gaedet.veterinarysystem.core.inventory.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.gaedet.veterinarysystem.core.inventory.enums.SupplierType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SupplierResponse {

    private Long id;
    private String name;
    private String ruc;
    private String address;
    private String website;
    private String contactPhone;
    private String email;
    private SupplierType supplierType;
    private String bankAccountNumber;
    private String bankName;
    private Boolean active;
}