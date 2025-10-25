package com.gaedet.biocampovet.core.inventory.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.Data;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

@Data
public class TransferProductRequest {
    @NotNull
    private Long productId;
    @NotNull
    private Long batchId;
    @NotNull
    @Positive
    private Double quantity;
    @NotNull
    private ProductUnitType unitType;
}