package com.gaedet.veterinarysystem.core.inventory.dto;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;
import javax.validation.Valid;

@Data
public class TransferCreateRequest {
    @NotNull
    private Long sourceBranchId;
    @NotNull
    private Long targetBranchId;
    private String description;
    @NotEmpty
    @Valid
    private List<TransferProductRequest> products;
}