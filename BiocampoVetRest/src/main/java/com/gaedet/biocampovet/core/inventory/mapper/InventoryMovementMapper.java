package com.gaedet.biocampovet.core.inventory.mapper;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.branches.mapper.BranchMapper;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.employees.mapper.EmployeeMapper;
import com.gaedet.biocampovet.core.inventory.dto.InventoryMovementProductResponse;
import com.gaedet.biocampovet.core.inventory.dto.InventoryMovementRequest;
import com.gaedet.biocampovet.core.inventory.dto.InventoryMovementResponse;
import com.gaedet.biocampovet.core.inventory.entity.*;
import com.gaedet.biocampovet.core.inventory.util.InventoryStockHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class InventoryMovementMapper {

    private final ProductMapper productMapper;
    private final BranchMapper branchMapper;
    private final SupplierMapper supplierMapper;
    private final EmployeeMapper employeeMapper;
    private final InventoryStockHelper inventoryStockHelper;

    public InventoryMovement toEntity(
            InventoryMovementRequest request,
            Branch sourceBranch,
            Branch targetBranch,
            Supplier supplier,
            Employee employee
    ) {
        InventoryMovement movement = new InventoryMovement();
        movement.setType(request.getType());
        movement.setDate(LocalDateTime.now());
        movement.setDescription(request.getDescription());
        movement.setSourceBranch(sourceBranch);
        movement.setTargetBranch(targetBranch);
        movement.setSupplier(supplier);
        movement.setEmployee(employee);

        List<InventoryMovementProduct> products = new ArrayList<>();

        for (var p : request.getProducts()) {
            Product productRef = new Product();
            productRef.setId(p.getProductId());

            ProductBatch batch = inventoryStockHelper.getOrCreateBatch(
                    p.getProductId(),
                    sourceBranch.getId(),
                    p.getBatchNumber(),
                    p.getExpirationDate()
            );

            InventoryMovementProduct item = new InventoryMovementProduct();
            item.setProduct(productRef);
            item.setQuantity(p.getQuantity());
            item.setUnitType(p.getProductUnitType());
            item.setUnitCost(p.getUnitCost());
            item.setProductBatch(batch);
            item.setMovement(movement);

            products.add(item);
        }

        movement.setProducts(products);
        return movement;
    }

    public InventoryMovementResponse toResponse(InventoryMovement movement) {
        return InventoryMovementResponse.builder()
                .id(movement.getId())
                .type(movement.getType())
                .sourceBranch(branchMapper.toResponse(movement.getSourceBranch()))
                .targetBranch(movement.getTargetBranch() != null ? branchMapper.toResponse(movement.getTargetBranch()) : null)
                .supplier(movement.getSupplier() != null ? supplierMapper.toResponse(movement.getSupplier()) : null)
                .employee(employeeMapper.toResponse(movement.getEmployee()))
                .date(movement.getDate())
                .description(movement.getDescription())
                .products(
                        movement.getProducts().stream()
                                .map(p -> InventoryMovementProductResponse.builder()
                                        .id(p.getId())
                                        .product(productMapper.toResponse(p.getProduct()))
                                        .quantity(p.getQuantity())
                                        .productUnitType(p.getUnitType())
                                        .unitCost(p.getUnitCost())
                                        .batchNumber(p.getProductBatch().getBatchNumber())
                                        .expirationDate(p.getProductBatch().getExpirationDate())
                                        .build()
                                ).toList()
                )
                .build();
    }
}

