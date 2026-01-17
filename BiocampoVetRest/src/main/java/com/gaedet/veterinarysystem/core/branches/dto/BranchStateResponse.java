package com.gaedet.veterinarysystem.core.branches.dto;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchStateResponse {
    private Long branchId;
    private String branchName;
    private Boolean active;
}