package com.gaedet.biocampovet.core.branches.dto;

import lombok.*;

import javax.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BranchActivationInput {
    @NotNull
    private Long branchId;
    @NotNull
    private Boolean active;
}