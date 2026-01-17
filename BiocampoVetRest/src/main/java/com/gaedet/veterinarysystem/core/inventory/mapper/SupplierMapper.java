package com.gaedet.veterinarysystem.core.inventory.mapper;

import com.gaedet.veterinarysystem.core.inventory.dto.SupplierCreateRequest;
import com.gaedet.veterinarysystem.core.inventory.dto.SupplierResponse;
import com.gaedet.veterinarysystem.core.inventory.dto.SupplierSummaryResponse;
import com.gaedet.veterinarysystem.core.inventory.dto.SupplierUpdateRequest;
import com.gaedet.veterinarysystem.core.inventory.entity.*;

public final class SupplierMapper {

    public static Supplier toEntity(SupplierCreateRequest request) {
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

    public static void updateEntity(Supplier supplier, SupplierUpdateRequest request) {
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

    public static SupplierResponse toResponse(Supplier supplier) {
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

    public static SupplierSummaryResponse toSummary(Supplier supplier) {
        if (supplier == null) {
            return null;
        }

        return SupplierSummaryResponse.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .ruc(supplier.getRuc())
                .address(supplier.getAddress())
                .website(supplier.getWebsite())
                .phone(supplier.getPhone())
                .email(supplier.getEmail())
                .supplierType(supplier.getSupplierType())
                .bankName(supplier.getBankName())
                .bankAccountNumber(supplier.getBankAccountNumber())
                .active(supplier.getActive())
                .build();
    }
}
