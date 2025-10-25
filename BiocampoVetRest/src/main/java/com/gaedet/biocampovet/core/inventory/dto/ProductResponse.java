package com.gaedet.biocampovet.core.inventory.dto;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductPresentationType;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private Integer minStock;
    private CategoryProductResponse category;
    private String sku;
    private ProductPresentationType presentation;
    private ProductUnitType unitType;
    private BigDecimal standardPrice;
    private Double contentTotal;

    private List<AdministrationRoute> administrationRoutes;
    private List<ProductBranchStockResponse> branchStocks;
    private List<ProductSaleModeResponse> saleModes;
}
