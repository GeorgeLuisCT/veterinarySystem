package com.gaedet.biocampovet.core.inventory.dto;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
public class AdjustmentCreateRequest {
    @NotNull
    private Long branchId;
    private String description;
    @NotEmpty
    private List<AdjustmentProductRequest> products;
}