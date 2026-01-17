package com.gaedet.veterinarysystem.core.inventory.dto;

import com.gaedet.veterinarysystem.core.inventory.enums.AdministrationRoute;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductPresentationType;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductSummaryResponse {
    private Long id;
    private String name;
    private String categoryName;
    private String description;
    private Integer minStock;
    private String sku;
    private ProductPresentationType presentation;
    private ProductUnitType unitType;
    private Double contentTotal;
    private BigDecimal standardPrice;

    private Set<AdministrationRoute> administrationRoutes;
    private List<SaleModeSummary> saleModes;
    private List<BranchStockSummary> branchStocks;

    private BigDecimal stockMainUnit;
    private BigDecimal stockBaseUnitRemainder;
    private Boolean isBelowMinStock;
    private Boolean isAvailable;
}

