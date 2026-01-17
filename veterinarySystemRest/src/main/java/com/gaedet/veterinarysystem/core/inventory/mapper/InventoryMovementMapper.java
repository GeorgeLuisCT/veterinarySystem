package com.gaedet.veterinarysystem.core.inventory.mapper;

import com.gaedet.veterinarysystem.core.branches.dto.BranchSummaryResponse;
import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.employees.dto.EmployeeSummaryResponse;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.inventory.dto.*;
import com.gaedet.veterinarysystem.core.inventory.entity.*;
import java.util.stream.Collectors;

public final class InventoryMovementMapper {

    public static InventoryMovementResponse toResponse(InventoryMovement entity) {
        if (entity == null) return null;
        return InventoryMovementResponse.builder()
                .id(entity.getId())
                .type(entity.getType())
                .date(entity.getDate())
                .description(entity.getDescription())
                .sourceBranch(toBranchSummary(entity.getSourceBranch()))
                .targetBranch(toBranchSummary(entity.getTargetBranch()))
                .supplier(toSupplierSummary(entity.getSupplier()))
                .employee(toEmployeeSummary(entity.getEmployee()))
                .products(entity.getProducts().stream()
                        .map(InventoryMovementMapper::toProductResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    public static InventoryMovementSummaryResponse toSummary(InventoryMovement entity) {
        if (entity == null) return null;
        return InventoryMovementSummaryResponse.builder()
                .id(entity.getId())
                .type(entity.getType())
                .date(entity.getDate())
                .description(entity.getDescription())
                .sourceBranchName(entity.getSourceBranch() != null ? entity.getSourceBranch().getName() : null)
                .targetBranchName(entity.getTargetBranch() != null ? entity.getTargetBranch().getName() : null)
                .supplierName(entity.getSupplier() != null ? entity.getSupplier().getName() : null)
                .employeeName(entity.getEmployee() != null ? (entity.getEmployee().getFirstName() + " " + entity.getEmployee().getLastName()) : null)
                .build();
    }

    public static InventoryMovementProductResponse toProductResponse(InventoryMovementProduct entity) {
        if (entity == null) return null;
        return InventoryMovementProductResponse.builder()
                .id(entity.getId())
                .quantity(entity.getQuantity())
                .unitType(entity.getUnitType())
                .unitCost(entity.getUnitCost())
                .product(toProductSummary(entity.getProduct()))
                .batch(toBatchSummary(entity.getProductBatch()))
                .build();
    }

    public static KardexMovementResponse toKardexResponse(KardexMovement entity) {
        if (entity == null) return null;
        return KardexMovementResponse.builder()
                .id(entity.getId())
                .date(entity.getDate())
                .type(entity.getType())
                .quantity(entity.getQuantity())
                .resultingStock(entity.getResultingStock())
                .originId(entity.getOriginId())
                .originType(entity.getOriginType())
                .productName(entity.getProduct() != null ? entity.getProduct().getName() : null)
                .batchNumber(entity.getBatch() != null ? entity.getBatch().getBatchNumber() : null)
                .expirationDate(entity.getBatch() != null ? entity.getBatch().getExpirationDate() : null)
                .build();
    }


    private static BranchSummaryResponse toBranchSummary(Branch entity) {
        if (entity == null) return null;
        return BranchSummaryResponse.builder().id(entity.getId()).name(entity.getName()).build();
    }

    private static SupplierSummaryResponse toSupplierSummary(Supplier entity) {
        if (entity == null) return null;
        return SupplierSummaryResponse.builder().id(entity.getId()).name(entity.getName()).build();
    }

    private static EmployeeSummaryResponse toEmployeeSummary(Employee entity) {
        if (entity == null) return null;
        return EmployeeSummaryResponse.builder()
                .id(entity.getId())
                .firstName(entity.getFirstName() + " " + entity.getLastName())
                .build();
    }

    private static ProductSummaryResponse toProductSummary(Product entity) {
        if (entity == null) return null;
        return ProductSummaryResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .sku(entity.getSku())
                .build();
    }

    private static ProductBatchSummaryResponse toBatchSummary(ProductBatch entity) {
        if (entity == null) return null;
        return ProductBatchSummaryResponse.builder()
                .id(entity.getId())
                .batchNumber(entity.getBatchNumber())
                .expirationDate(entity.getExpirationDate())
                .build();
    }
}

