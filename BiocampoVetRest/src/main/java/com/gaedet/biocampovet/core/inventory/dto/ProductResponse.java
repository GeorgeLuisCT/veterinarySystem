package com.gaedet.biocampovet.core.inventory.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductPresentationType;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private CategoryProductResponse categoryResponse;
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
