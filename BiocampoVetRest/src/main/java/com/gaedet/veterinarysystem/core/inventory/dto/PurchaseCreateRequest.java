package com.gaedet.veterinarysystem.core.inventory.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PurchaseCreateRequest {
    @NotNull
    private Long branchId;
    @NotNull
    private Long supplierId;
    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime date;
    private String description;
    @NotEmpty
    private List<PurchaseProductRequest> products;
    private Boolean payNow = Boolean.FALSE;
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal paymentAmount;
    private Long paymentTreasuryAccountId;
}
