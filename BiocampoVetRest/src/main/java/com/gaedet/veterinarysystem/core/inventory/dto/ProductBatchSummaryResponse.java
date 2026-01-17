package com.gaedet.veterinarysystem.core.inventory.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ProductBatchSummaryResponse {
    private Long id;
    private String batchNumber;
    private LocalDate expirationDate;
}