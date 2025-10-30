package com.gaedet.biocampovet.core.inventory.mapper;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.inventory.dto.*;
import com.gaedet.biocampovet.core.inventory.entity.CategoryProduct;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.entity.ProductBranch;
import com.gaedet.biocampovet.core.inventory.entity.ProductSaleMode;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.inventory.util.UnitConversionUtil;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

public final class ProductMapper {

    public static Product toEntity(ProductCreateRequest request, CategoryProduct category) {
        return Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .minStock(request.getMinStock())
                .category(category)
                .sku(request.getSku())
                .presentation(request.getPresentation())
                .unitType(request.getBaseUnitType())
                .contentTotal(request.getContentTotal())
                .administrationRoutes(
                        request.getAdministrationRoutes() == null
                                ? new java.util.HashSet<>()
                                : new java.util.HashSet<>(request.getAdministrationRoutes())
                )
                .build();
    }

    public static ProductResponse toResponse(
            Product p,
            BigDecimal mainStockBaseUnit,
            Map<Long, BigDecimal> branchStockMap
    ) {

        BigDecimal basePrice = p.getSaleModes().stream()
                .filter(ProductSaleMode::getIsBaseMode)
                .findFirst()
                .map(ProductSaleMode::getPrice)
                .orElse(BigDecimal.ZERO);

        final BigDecimal baseEquivalence = BigDecimal.valueOf(p.getContentTotal());
        final ProductUnitType baseUnit = p.getUnitType();

        List<SaleModeSummary> saleModes = p.getSaleModes().stream()
                .filter(mode -> !mode.getIsBaseMode())
                .sorted(Comparator.comparing(ProductSaleMode::getUnitType))
                .map(mode -> toSaleModeSummary(mode, baseEquivalence, baseUnit))
                .toList();

        Map<Long, BigDecimal> safeBranchStockMap = Optional.ofNullable(branchStockMap).orElse(Collections.emptyMap());

        List<BranchStockSummary> stocks = p.getBranchStocks().stream()
                .sorted(Comparator.comparing(s -> s.getBranch().getName(), String.CASE_INSENSITIVE_ORDER))
                .map(s -> {
                    BigDecimal stockBase = safeBranchStockMap.getOrDefault(s.getBranch().getId(), BigDecimal.ZERO);
                    StockTuple branchStockTuple = convertStockToTuple(stockBase, p.getContentTotal());

                    return BranchStockSummary.builder()
                            .branchId(s.getBranch().getId())
                            .branchName(s.getBranch().getName())
                            .active(s.isActive())
                            .stockMainUnit(branchStockTuple.getMainUnit())
                            .stockBaseUnitRemainder(branchStockTuple.getBaseUnitRemainder())
                            .build();
                })
                .toList();

        StockTuple mainStockTuple = convertStockToTuple(mainStockBaseUnit, p.getContentTotal());
        int minStock = p.getMinStock() == null ? 0 : p.getMinStock();

        BigDecimal minStockInBaseUnit = BigDecimal.valueOf(minStock).multiply(BigDecimal.valueOf(p.getContentTotal()));
        boolean isBelowMin = mainStockBaseUnit.compareTo(minStockInBaseUnit) < 0;
        boolean isAvailable = mainStockBaseUnit.compareTo(BigDecimal.ZERO) > 0;

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .categoryResponse(CategoryProductMapper.toResponse(p.getCategory()))
                .description(p.getDescription())
                .minStock(p.getMinStock())
                .sku(p.getSku())
                .presentation(p.getPresentation())
                .unitType(p.getUnitType())
                .contentTotal(p.getContentTotal())
                .standardPrice(basePrice)
                .administrationRoutes(p.getAdministrationRoutes() != null ? p.getAdministrationRoutes() : Set.of())
                .saleModes(saleModes)
                .branchStocks(stocks)
                .stockMainUnit(mainStockTuple.getMainUnit())
                .stockBaseUnitRemainder(mainStockTuple.getBaseUnitRemainder())
                .isBelowMinStock(isBelowMin)
                .isAvailable(isAvailable)
                .build();
    }

    public static ProductSummaryResponse toSummary(Product p, BigDecimal mainStockBaseUnit, Map<Long, BigDecimal> branchStockMap) {

        BigDecimal basePrice = p.getSaleModes().stream()
                .filter(ProductSaleMode::getIsBaseMode)
                .findFirst()
                .map(ProductSaleMode::getPrice)
                .orElse(BigDecimal.ZERO);


        final BigDecimal baseEquivalence = BigDecimal.valueOf(p.getContentTotal());
        final ProductUnitType baseUnit = p.getUnitType();

        List<SaleModeSummary> saleModes = p.getSaleModes().stream()
                .filter(sm -> !sm.getIsBaseMode())
                .sorted(Comparator.comparing(ProductSaleMode::getUnitType))
                .map(mode -> toSaleModeSummary(mode, baseEquivalence, baseUnit))
                .toList();


        Map<Long, BigDecimal> safeBranchStockMap = Optional.ofNullable(branchStockMap).orElse(Collections.emptyMap());

        List<BranchStockSummary> stocks = p.getBranchStocks().stream()
                .sorted(Comparator.comparing(s -> s.getBranch().getName(), String.CASE_INSENSITIVE_ORDER))
                .map(s -> {
                    BigDecimal stockBase = safeBranchStockMap.getOrDefault(s.getBranch().getId(), BigDecimal.ZERO);
                    StockTuple branchStockTuple = convertStockToTuple(stockBase, p.getContentTotal());

                    return BranchStockSummary.builder()
                            .branchId(s.getBranch().getId())
                            .branchName(s.getBranch().getName())
                            .active(s.isActive())
                            .stockMainUnit(branchStockTuple.getMainUnit())
                            .stockBaseUnitRemainder(branchStockTuple.getBaseUnitRemainder())
                            .build();
                })
                .toList();

        StockTuple mainStockTuple = convertStockToTuple(mainStockBaseUnit, p.getContentTotal());
        int minStock = p.getMinStock() == null ? 0 : p.getMinStock();

        BigDecimal minStockInBaseUnit = BigDecimal.valueOf(minStock).multiply(BigDecimal.valueOf(p.getContentTotal()));
        boolean isBelowMin = mainStockBaseUnit.compareTo(minStockInBaseUnit) < 0;
        boolean isAvailable = mainStockBaseUnit.compareTo(BigDecimal.ZERO) > 0;

        return ProductSummaryResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .description(p.getDescription())
                .minStock(p.getMinStock())
                .sku(p.getSku())
                .presentation(p.getPresentation())
                .unitType(p.getUnitType())
                .contentTotal(p.getContentTotal())
                .standardPrice(basePrice)
                .administrationRoutes(p.getAdministrationRoutes() != null ? p.getAdministrationRoutes() : Set.of())
                .saleModes(saleModes)
                .branchStocks(stocks)
                .stockMainUnit(mainStockTuple.getMainUnit())
                .stockBaseUnitRemainder(mainStockTuple.getBaseUnitRemainder())
                .isBelowMinStock(isBelowMin)
                .isAvailable(isAvailable)
                .build();
    }

    public static void updateEntity(Product product, ProductUpdateRequest request, CategoryProduct category) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setMinStock(request.getMinStock());
        product.setSku(request.getSku());
        product.setPresentation(request.getPresentation());
        product.setUnitType(request.getBaseUnitType());
        product.setCategory(category);
        product.setContentTotal(request.getContentTotal());

        java.util.Set<AdministrationRoute> routes = request.getAdministrationRoutes() == null
                ? new java.util.HashSet<>()
                : new java.util.HashSet<>(request.getAdministrationRoutes());
        product.setAdministrationRoutes(routes);
    }

    @Data
    @AllArgsConstructor
    private static class StockTuple {
        private BigDecimal mainUnit;
        private BigDecimal baseUnitRemainder;
    }

    private static StockTuple convertStockToTuple(BigDecimal totalStockBaseUnit, Double contentTotal) {
        if (contentTotal == null || contentTotal <= 0) {
            return new StockTuple(totalStockBaseUnit, BigDecimal.ZERO);
        }

        BigDecimal mainUnitSize = BigDecimal.valueOf(contentTotal);

        BigDecimal mainUnit = totalStockBaseUnit.divide(mainUnitSize, 0, RoundingMode.FLOOR);
        BigDecimal baseUnitRemainder = totalStockBaseUnit.remainder(mainUnitSize);

        return new StockTuple(mainUnit, baseUnitRemainder);
    }

    public static SaleModeSummary toSaleModeSummary(ProductSaleMode mode, BigDecimal baseEquivalence, ProductUnitType baseUnit) {

        BigDecimal relativeQuantity;
        BigDecimal absoluteQuantity = BigDecimal.valueOf(mode.getQuantityEquivalent());

        if (mode.getUnitType().isFracionable()) {
            relativeQuantity = UnitConversionUtil.convertFromBase(
                    absoluteQuantity,
                    baseUnit,
                    mode.getUnitType()
            );

        } else {
            if (baseEquivalence.compareTo(BigDecimal.ZERO) == 0) {
                relativeQuantity = BigDecimal.ZERO;
            } else {
                relativeQuantity = absoluteQuantity.divide(baseEquivalence, 6, RoundingMode.HALF_UP);
            }
        }

        return SaleModeSummary.builder()
                .id(mode.getId())
                .unitType(mode.getUnitType())
                .relativeQuantity(relativeQuantity)
                .price(mode.getPrice())
                .build();
    }

    public static ProductBasicResponse toBasicResponse(Product p) {
        if (p == null) {
            return null;
        }
        return ProductBasicResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .unitType(p.getUnitType())
                .presentation(p.getPresentation())
                .build();
    }
}
