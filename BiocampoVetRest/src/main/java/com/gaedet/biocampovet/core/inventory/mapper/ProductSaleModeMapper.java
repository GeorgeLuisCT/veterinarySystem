package com.gaedet.biocampovet.core.inventory.mapper;

import com.gaedet.biocampovet.core.inventory.dto.ProductCreateRequest;
import com.gaedet.biocampovet.core.inventory.dto.ProductSaleModeRequest;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.entity.ProductSaleMode;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.exeption.BadRequestException;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

public final class ProductSaleModeMapper {

    public static Set<ProductSaleMode> toEntitySet(Product product, ProductCreateRequest request) {

        Set<ProductSaleMode> saleModes = new java.util.HashSet<>();
        Map<ProductUnitType, Double> equivalentsMap = new HashMap<>();

        equivalentsMap.put(product.getUnitType(), 1.0);

        ProductSaleMode principalSaleMode = ProductSaleMode.builder()
                .product(product)
                .unitType(request.getMainUnitType())
                .quantityEquivalent(request.getContentTotal())
                .price(request.getStandardPrice())
                .isBaseMode(true)
                .build();

        saleModes.add(principalSaleMode);

        equivalentsMap.put(principalSaleMode.getUnitType(), principalSaleMode.getQuantityEquivalent());

        if (request.getSaleModes() != null) {

            for (ProductSaleModeRequest modeReq : request.getSaleModes()) {

                Double relativeEquivalent = equivalentsMap.get(modeReq.getRelativeUnitType());

                if (relativeEquivalent == null) {
                    throw new BadRequestException("Unidad relativa no válida: " + modeReq.getRelativeUnitType());
                }

                Double finalEquivalent = modeReq.getRelativeQuantity() * relativeEquivalent;

                ProductSaleMode otherSaleMode = ProductSaleMode.builder()
                        .product(product)
                        .unitType(modeReq.getUnitType())
                        .quantityEquivalent(finalEquivalent)
                        .price(modeReq.getPrice())
                        .isBaseMode(false)
                        .build();

                saleModes.add(otherSaleMode);

                equivalentsMap.put(otherSaleMode.getUnitType(), otherSaleMode.getQuantityEquivalent());
            }
        }
        return saleModes;
    }
}
