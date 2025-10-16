package com.gaedet.biocampovet.core.inventory.mapper;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.inventory.dto.*;
import com.gaedet.biocampovet.core.inventory.entity.CategoryProduct;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.entity.ProductBranchStock;
import com.gaedet.biocampovet.core.inventory.entity.ProductSaleMode;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.inventory.util.ProductUnitConverterUtil;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class ProductMapper {

    private final CategoryProductMapper categoryProductMapper;

    ProductMapper(CategoryProductMapper categoryProductMapper) {
        this.categoryProductMapper = categoryProductMapper;
    }

    public Product toEntity(ProductCreateRequest request, CategoryProduct category, List<Branch> allBranches) {
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
                .build();

        Set<Long> activeBranchIds = new HashSet<>(request.getBranchIds());

        Set<ProductBranchStock> branchStocks = allBranches.stream()
                .map(branch -> ProductBranchStock.builder()
                        .branch(branch)
                        .product(product)
                        .isActive(activeBranchIds.contains(branch.getId()))
                        .stockUnits(0)
                        .stockFractional(0.0)
                        .build())
                .collect(Collectors.toSet());

        product.setBranchStocks(branchStocks);

        Set<ProductSaleMode> saleModes = request.getSaleModes().stream()
                .map(modeReq -> ProductSaleMode.builder()
                        .product(product)
                        .unitType(modeReq.getUnitType())
                        .quantityEquivalent(modeReq.getQuantityEquivalent())
                        .price(modeReq.getPrice())
                        .build())
                .collect(Collectors.toSet());

        product.setSaleModes(saleModes);

        return product;
    }

    public ProductResponse toResponse(Product product) {

        List<ProductBranchStockResponse> branchStocks = product.getBranchStocks().stream()
                .map(pbs -> ProductBranchStockResponse.builder()
                        .id(pbs.getId())
                        .branchId(pbs.getBranch().getId())
                        .branchName(pbs.getBranch().getName())
                        .stockUnits(pbs.getStockUnits())
                        .stockFractional(pbs.getStockFractional())
                        .build())
                .toList();

        List<ProductSaleModeResponse> saleModes = product.getSaleModes().stream()
                .map(psm -> ProductSaleModeResponse.builder()
                        .id(psm.getId())
                        .unitType(psm.getUnitType())
                        .price(psm.getPrice())
                        .quantityEquivalent(psm.getQuantityEquivalent())
                        .build())
                .toList();

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .minStock(product.getMinStock())
                .category(categoryProductMapper.toResponse(product.getCategory()))
                .sku(product.getSku())
                .presentation(product.getPresentation())
                .unitType(product.getUnitType())
                .standardPrice(product.getStandardPrice())
                .contentTotal(product.getContentTotal())
                .branchStocks(branchStocks)
                .saleModes(saleModes)
                .build();
    }

    public ProductSummaryResponse toProductSummaryResponse(Product product) {
        ProductUnitType unitType = product.getUnitType();

        int totalUnits = product.getBranchStocks().stream()
                .mapToInt(ProductBranchStock::getStockUnits)
                .sum();

        double totalFractional = product.getBranchStocks().stream()
                .mapToDouble(ProductBranchStock::getStockFractional)
                .sum();

        String formattedStock = ProductUnitConverterUtil.formatStock(unitType, totalUnits, totalFractional);

        String branchNames = product.getBranchStocks().stream()
                .map(stock -> stock.getBranch().getName())
                .distinct()
                .collect(Collectors.joining(", "));

        return new ProductSummaryResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getCategory().getName(),
                product.getStandardPrice(),
                formattedStock,
                branchNames
        );
    }

    public void updateEntity(Product product, ProductUpdateRequest request, CategoryProduct category) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setMinStock(request.getMinStock());
        product.setSku(request.getSku());
        product.setPresentation(request.getPresentation());
        product.setUnitType(request.getUnitType());
        product.setCategory(category);
        product.setStandardPrice(request.getStandardPrice());
        product.setContentTotal(request.getContentTotal());
    }
}

