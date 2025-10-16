package com.gaedet.biocampovet.core.inventory.mapper;

import com.gaedet.biocampovet.core.inventory.dto.ProductSaleModeRequest;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.entity.ProductSaleMode;
import org.springframework.stereotype.Component;

@Component
public class ProductSaleModeMapper {

    public ProductSaleMode mapNewSaleMode(Product product, ProductSaleModeRequest request) {
        return ProductSaleMode.builder()
                .product(product)
                .unitType(request.getUnitType())
                .quantityEquivalent(request.getQuantityEquivalent())
                .price(request.getPrice())
                .build();
    }
}
