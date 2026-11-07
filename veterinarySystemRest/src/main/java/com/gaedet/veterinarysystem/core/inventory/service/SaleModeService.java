package com.gaedet.veterinarysystem.core.inventory.service;

import com.gaedet.veterinarysystem.core.inventory.dto.ProductSaleModeRequest;
import com.gaedet.veterinarysystem.core.inventory.dto.ProductUpdateRequest;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;
import com.gaedet.veterinarysystem.core.inventory.entity.ProductSaleMode;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import com.gaedet.veterinarysystem.core.inventory.repository.ProductSaleModeRepository;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import org.springframework.stereotype.Service;

import java.util.*;
import javax.persistence.EntityNotFoundException;

@Service
public class SaleModeService {

    private final ProductSaleModeRepository productSaleModeRepository;
    SaleModeService( ProductSaleModeRepository productSaleModeRepository){
        this.productSaleModeRepository = productSaleModeRepository;
    }

    public void deleteUnnecessarySaleModes(Product product, ProductUpdateRequest request) {
        java.util.Set<Long> updatedIds;
        if (request.getSaleModes() != null) {
            updatedIds = request.getSaleModes().stream()
                    .map(ProductSaleModeRequest::getId)
                    .filter(java.util.Objects::nonNull)
                    .collect(java.util.stream.Collectors.toSet());
        } else {
            updatedIds = new HashSet<>();
        }

        Long baseModeId = product.getSaleModes().stream()
                .filter(ProductSaleMode::getIsBaseMode)
                .map(ProductSaleMode::getId)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Producto no tiene modo de venta base."));

        updatedIds.add(baseModeId);

        productSaleModeRepository.deleteSaleModesNotIn(updatedIds);

        product.getSaleModes().removeIf(saleMode ->
                saleMode.getId() != null && !updatedIds.contains(saleMode.getId())
        );
    }

    public void updateOrAddSaleModes(Product product, ProductUpdateRequest request) {

        if (product.getUnitType() == ProductUnitType.UNIT &&
                request.getMainUnitType() == ProductUnitType.UNIT &&
                request.getContentTotal() != 1.0) {

            throw new BadRequestException(
                    "Si la unidad base y la unidad de venta principal son 'UNIDAD', " +
                            "el contenido total (contentTotal) debe ser exactamente 1.0"
            );
        }

        ProductSaleMode baseMode = product.getSaleModes().stream()
                .filter(ProductSaleMode::getIsBaseMode)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Producto no tiene modo de venta base."));

        baseMode.setUnitType(request.getMainUnitType());
        baseMode.setQuantityEquivalent(request.getContentTotal());
        baseMode.setPrice(request.getStandardPrice());

        Map<ProductUnitType, Double> equivalentsMap = new HashMap<>();

        equivalentsMap.put(product.getUnitType(), 1.0);

        equivalentsMap.put(baseMode.getUnitType(), baseMode.getQuantityEquivalent());

        Set<ProductUnitType> unitTypes = new HashSet<>();
        unitTypes.add(product.getUnitType());
        unitTypes.add(baseMode.getUnitType());

        if (request.getSaleModes() == null) {
            return;
        }

        for (ProductSaleModeRequest req : request.getSaleModes()) {

            if (!unitTypes.add(req.getUnitType())) {
                if(req.getId() == null) {
                    throw new IllegalArgumentException("No se puede repetir el tipo de unidad en los modos de venta: " + req.getUnitType());
                }
            }

            Double relativeEquivalent = equivalentsMap.get(req.getRelativeUnitType());

            if (relativeEquivalent == null) {
                relativeEquivalent = product.getSaleModes().stream()
                        .filter(sm -> sm.getUnitType() == req.getRelativeUnitType())
                        .findFirst()
                        .map(ProductSaleMode::getQuantityEquivalent)
                        .orElseThrow(() -> new BadRequestException("Unidad relativa no válida o no definida: " + req.getRelativeUnitType()));

                equivalentsMap.put(req.getRelativeUnitType(), relativeEquivalent);
            }

            Double finalEquivalent = req.getRelativeQuantity() * relativeEquivalent;

            if (req.getId() != null) {
                ProductSaleMode existing = product.getSaleModes().stream()
                        .filter(sm -> req.getId().equals(sm.getId()))
                        .findFirst()
                        .orElseThrow(() -> new EntityNotFoundException("Modo de venta no encontrado: " + req.getId()));

                if (existing.getIsBaseMode()) {
                    throw new IllegalArgumentException("No se puede actualizar el modo de venta base a través de la lista 'saleModes'.");
                }
                if (!existing.getUnitType().equals(req.getUnitType())) {
                    throw new IllegalArgumentException("No se puede cambiar el tipo de unidad de un modo existente");
                }

                existing.setQuantityEquivalent(finalEquivalent);
                existing.setPrice(req.getPrice());

                equivalentsMap.put(existing.getUnitType(), finalEquivalent);

            } else {
                ProductSaleMode newMode = ProductSaleMode.builder()
                        .product(product)
                        .unitType(req.getUnitType())
                        .quantityEquivalent(finalEquivalent)
                        .price(req.getPrice())
                        .isBaseMode(false)
                        .build();
                product.getSaleModes().add(newMode);

                equivalentsMap.put(newMode.getUnitType(), finalEquivalent);
            }
        }
    }
}
