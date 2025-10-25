package com.gaedet.biocampovet.core.inventory.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PurchaseProductRequest {
    @NotNull
    private Long productId;
    @NotBlank
    private String batchNumber;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate expirationDate;
    @NotNull
    @Positive
    private Double quantity;
    @NotNull
    private ProductUnitType unitType;
    @NotNull
    private BigDecimal unitCost;
}