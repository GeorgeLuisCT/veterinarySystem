package com.gaedet.biocampovet.core.inventory.mapper;

import com.gaedet.biocampovet.core.inventory.dto.SupplierCreateRequest;
import com.gaedet.biocampovet.core.inventory.dto.SupplierResponse;
import com.gaedet.biocampovet.core.inventory.dto.SupplierSummaryResponse;
import com.gaedet.biocampovet.core.inventory.dto.SupplierUpdateRequest;
import com.gaedet.biocampovet.core.inventory.entity.*;
import org.springframework.stereotype.Component;

@Component
public class SupplierMapper {

    public Supplier toEntity(SupplierCreateRequest request) {
        return Supplier.builder()
                .name(request.getName())
                .ruc(request.getRuc())
                .address(request.getAddress())
                .website(request.getWebsite())
                .phone(request.getContactPhone())
                .email(request.getEmail())
                .supplierType(request.getSupplierType())
                .bankAccountNumber(request.getBankAccountNumber())
                .bankName(request.getBankName())
                .active(true)
                .build();
    }

    public void updateEntity(Supplier supplier, SupplierUpdateRequest request) {
        supplier.setName(request.getName());
        supplier.setRuc(request.getRuc());
        supplier.setAddress(request.getAddress());
        supplier.setWebsite(request.getWebsite());
        supplier.setPhone(request.getContactPhone());
        supplier.setEmail(request.getEmail());
        supplier.setSupplierType(request.getSupplierType());
        supplier.setBankAccountNumber(request.getBankAccountNumber());
        supplier.setBankName(request.getBankName());
    }

    public SupplierResponse toResponse(Supplier supplier) {
        return SupplierResponse.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .ruc(supplier.getRuc())
                .address(supplier.getAddress())
                .website(supplier.getWebsite())
                .contactPhone(supplier.getPhone())
                .email(supplier.getEmail())
                .supplierType(supplier.getSupplierType())
                .bankAccountNumber(supplier.getBankAccountNumber())
                .bankName(supplier.getBankName())
                .active(supplier.getActive())
                .build();
    }

    public SupplierSummaryResponse toSummaryResponse(Supplier supplier) {
        return new SupplierSummaryResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getRuc(),
                supplier.getPhone(),
                supplier.getEmail(),
                supplier.getSupplierType(),
                supplier.getActive()
        );
    }
}
