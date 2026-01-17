package com.gaedet.veterinarysystem.core.inventory.dto;

import com.gaedet.veterinarysystem.core.inventory.enums.KardexMovementType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KardexMovementResponse {
    private Long id;
    private LocalDateTime date;
    private KardexMovementType type;
    private BigDecimal quantity;
    private BigDecimal resultingStock;
    private Long originId;
    private String originType;
    private String productName;
    private String batchNumber;
    private LocalDate expirationDate;
}