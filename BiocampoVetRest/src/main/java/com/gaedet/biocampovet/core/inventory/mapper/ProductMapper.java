package com.gaedet.biocampovet.core.inventory.mapper;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.inventory.dto.*;
import com.gaedet.biocampovet.core.inventory.entity.CategoryProduct;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.entity.ProductBranch;
import com.gaedet.biocampovet.core.inventory.entity.ProductSaleMode;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;

import java.util.*;

public final class ProductMapper {

    public static Product toEntity(ProductCreateRequest request, CategoryProduct category, List<Branch> allBranches) {
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .minStock(request.getMinStock())
                .category(category)
                .sku(request.getSku())
                .presentation(request.getPresentation())
                .unitType(request.getUnitType())
                .standardPrice(request.getStandardPrice())
                .contentTotal(request.getContentTotal())
                .administrationRoutes(
                        request.getAdministrationRoutes() == null
                                ? new java.util.HashSet<>()
                                : new java.util.HashSet<>(request.getAdministrationRoutes())
                )
                .build();

        Set<Long> activeBranchIds = request.getBranchIds() == null
                ? java.util.Collections.emptySet()
                : new java.util.HashSet<>(request.getBranchIds());

        Set<ProductBranch> branchStocks = allBranches.stream()
                .map(branch -> ProductBranch.builder()
                        .branch(branch)
                        .product(product)
                        .isActive(activeBranchIds.contains(branch.getId()))
                        .build())
                .collect(java.util.stream.Collectors.toSet());
        product.setBranchStocks(branchStocks);

        Set<ProductSaleMode> saleModes = (request.getSaleModes() == null
                ? java.util.Collections.<ProductSaleModeRequest>emptySet()
                : request.getSaleModes())
                .stream()
                .map(modeReq -> ProductSaleMode.builder()
                        .product(product)
                        .unitType(modeReq.getUnitType())
                        .quantityEquivalent(modeReq.getQuantityEquivalent())
                        .price(modeReq.getPrice())
                        .build())
                .collect(java.util.stream.Collectors.toSet());
        product.setSaleModes(saleModes);

        return product;
    }

    public static ProductResponse toResponse(Product product) {
        java.util.List<ProductBranchStockResponse> branchStocks = product.getBranchStocks().stream()
                .map(pbs -> ProductBranchStockResponse.builder()
                        .id(pbs.getId())
                        .branchId(pbs.getBranch().getId())
                        .branchName(pbs.getBranch().getName())
                        .build())
                .toList();

        java.util.List<ProductSaleModeResponse> saleModes = product.getSaleModes().stream()
                .map(psm -> ProductSaleModeResponse.builder()
                        .id(psm.getId())
                        .unitType(psm.getUnitType())
                        .price(psm.getPrice())
                        .quantityEquivalent(psm.getQuantityEquivalent())
                        .build())
                .toList();

        java.util.List<AdministrationRoute> routes = product.getAdministrationRoutes() == null
                ? java.util.Collections.emptyList()
                : new java.util.ArrayList<>(product.getAdministrationRoutes());

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .minStock(product.getMinStock())
                .category(CategoryProductMapper.toResponse(product.getCategory()))
                .sku(product.getSku())
                .presentation(product.getPresentation())
                .unitType(product.getUnitType())
                .standardPrice(product.getStandardPrice())
                .contentTotal(product.getContentTotal())
                .administrationRoutes(routes)
                .branchStocks(branchStocks)
                .saleModes(saleModes)
                .build();
    }

    public static ProductSummaryResponse toSummary(Product p) {
        List<SaleModeSummary> saleModes = p.getSaleModes() == null ? List.of() :
                p.getSaleModes().stream()
                        .sorted(Comparator.comparing(ProductSaleMode::getUnitType))
                        .map(sm -> SaleModeSummary.builder()
                                .unitType(sm.getUnitType())
                                .quantityEquivalent(sm.getQuantityEquivalent())
                                .price(sm.getPrice())
                                .build())
                        .toList();

        List<BranchStockSummary> stocks = p.getBranchStocks() == null ? List.of() :
                p.getBranchStocks().stream()
                        .sorted(Comparator.comparing(x -> x.getBranch().getName(), String.CASE_INSENSITIVE_ORDER))
                        .map(s -> BranchStockSummary.builder()
                                .branchId(s.getBranch().getId())
                                .branchName(s.getBranch().getName())
                                .active(s.isActive())
                                .build())
                        .toList();

        int totalUnits = stocks.stream().mapToInt(bs -> nvl(bs.getStockUnits(), 0)).sum();
        double totalFrac = stocks.stream().mapToDouble(bs -> nvl(bs.getStockFractional(), 0.0)).sum();
        boolean belowMin = (totalUnits + totalFrac) < nvl(p.getMinStock(), 0);

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
                .standardPrice(p.getStandardPrice())
                .administrationRoutes(p.getAdministrationRoutes() != null ? p.getAdministrationRoutes() : Set.of())
                .saleModes(saleModes)
                .branchStocks(stocks)
                .totalStockUnits(totalUnits)
                .totalStockFractional(totalFrac)
                .belowMinStock(belowMin)
                .build();
    }

    public static void updateEntity(Product product, ProductUpdateRequest request, CategoryProduct category) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setMinStock(request.getMinStock());
        product.setSku(request.getSku());
        product.setPresentation(request.getPresentation());
        product.setUnitType(request.getUnitType());
        product.setCategory(category);
        product.setStandardPrice(request.getStandardPrice());
        product.setContentTotal(request.getContentTotal());

        java.util.Set<AdministrationRoute> routes = request.getAdministrationRoutes() == null
                ? new java.util.HashSet<>()
                : new java.util.HashSet<>(request.getAdministrationRoutes());
        product.setAdministrationRoutes(routes);
    }

    private static Integer nvl(Integer v, Integer d) { return v == null ? d : v; }
    private static Double nvl(Double v, Double d) { return v == null ? d : v; }
}
