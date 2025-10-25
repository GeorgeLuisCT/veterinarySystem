package com.gaedet.biocampovet.core.inventory.dto;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
public class TransferCreateRequest {
    @NotNull
    private Long sourceBranchId;
    @NotNull
    private Long targetBranchId;
    private String description;
    @NotEmpty
    private List<TransferProductRequest> products;
}