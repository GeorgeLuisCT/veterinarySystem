package com.gaedet.veterinarysystem.core.employees.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeBranchResponse {
    private Long id;
    private Long branchId;
    private String branchName;
    private boolean active;
}
