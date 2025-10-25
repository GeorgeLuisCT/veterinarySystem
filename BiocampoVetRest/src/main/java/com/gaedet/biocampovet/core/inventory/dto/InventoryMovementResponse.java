package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.branches.dto.BranchResponse;
import com.gaedet.biocampovet.core.branches.dto.BranchSummaryResponse;
import com.gaedet.biocampovet.core.employees.dto.EmployeeResponse;
import com.gaedet.biocampovet.core.employees.dto.EmployeeSummaryResponse;
import com.gaedet.biocampovet.core.inventory.enums.InventoryMovementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryMovementResponse {
    private Long id;
    private InventoryMovementType type;
    private LocalDateTime date;
    private BranchSummaryResponse sourceBranch;
    private BranchSummaryResponse targetBranch;
    private SupplierSummaryResponse supplier;
    private EmployeeSummaryResponse employee;
    private String description;
    private List<InventoryMovementProductResponse> products;
}