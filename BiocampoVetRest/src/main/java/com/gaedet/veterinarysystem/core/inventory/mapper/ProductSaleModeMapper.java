package com.gaedet.veterinarysystem.core.inventory.mapper;

import com.gaedet.veterinarysystem.core.inventory.dto.ProductCreateRequest;
import com.gaedet.veterinarysystem.core.inventory.dto.ProductSaleModeRequest;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;
import com.gaedet.veterinarysystem.core.inventory.entity.ProductSaleMode;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import com.gaedet.veterinarysystem.core.inventory.util.UnitConversionUtil;
import com.gaedet.veterinarysystem.exeption.BadRequestException;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public final class ProductSaleModeMapper {

    private ProductSaleModeMapper() {
    }

    public static Set<ProductSaleMode> toEntitySet(Product product, ProductCreateRequest request) {

        if (product.getUnitType() == ProductUnitType.UNIT &&
                request.getMainUnitType() == ProductUnitType.UNIT &&
                request.getContentTotal() != 1.0) {

            throw new BadRequestException(
                    "Si la unidad base y la unidad de venta principal son 'UNIDAD', " +
                            "el contenido total (contentTotal) debe ser exactamente 1.0"
            );
        }

        Set<ProductSaleMode> saleModes = new HashSet<>();
        Map<ProductUnitType, Double> equivalentsMap = new HashMap<>();

        UnitConversionUtil.populateEquivalentsMap(equivalentsMap, product.getUnitType());

        ProductSaleMode principalSaleMode = ProductSaleMode.builder()
                .product(product)
                .unitType(request.getMainUnitType())
                .quantityEquivalent(request.getContentTotal())
                .price(request.getStandardPrice())
                .isBaseMode(true)
                .build();

        saleModes.add(principalSaleMode);

        equivalentsMap.putIfAbsent(principalSaleMode.getUnitType(), principalSaleMode.getQuantityEquivalent());

        if (request.getSaleModes() != null) {

            for (ProductSaleModeRequest modeReq : request.getSaleModes()) {

                Double relativeEquivalentToBase = equivalentsMap.get(modeReq.getRelativeUnitType());

                if (relativeEquivalentToBase == null) {
                    throw new BadRequestException("Unidad relativa no válida o no definida para esta unidad base: " + modeReq.getRelativeUnitType());
                }

                Double finalEquivalentInBaseUnit = modeReq.getRelativeQuantity() * relativeEquivalentToBase;

                ProductSaleMode otherSaleMode = ProductSaleMode.builder()
                        .product(product)
                        .unitType(modeReq.getUnitType())
                        .quantityEquivalent(finalEquivalentInBaseUnit)
                        .price(modeReq.getPrice())
                        .isBaseMode(false)
                        .build();

                saleModes.add(otherSaleMode);

                equivalentsMap.putIfAbsent(otherSaleMode.getUnitType(), otherSaleMode.getQuantityEquivalent());
            }
        }
        return saleModes;
    }
}