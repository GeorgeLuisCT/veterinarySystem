package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.employees.dto.EmployeeResponse;
import com.gaedet.biocampovet.core.inventory.enums.InventoryMovementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryMovementResponse {
    private Long id;
    private InventoryMovementType type;
    private BranchResponse sourceBranch;
    private BranchResponse targetBranch;
    private SupplierResponse supplier;
    private EmployeeResponse employee;
    private LocalDateTime date;
    private String description;
    private List<InventoryMovementProductResponse> products;
}
