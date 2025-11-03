package com.gaedet.biocampovet.core.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductBatchSearchResponse {
    private Long id;
    private String batchNumber;
    private Long productId;
    private LocalDate expirationDate;
}