package com.gaedet.biocampovet.core.inventory.service;

import com.gaedet.biocampovet.core.inventory.dto.ProductSaleModeRequest;
import com.gaedet.biocampovet.core.inventory.dto.ProductUpdateRequest;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.entity.ProductSaleMode;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.inventory.repository.ProductSaleModeRepository;
import com.gaedet.biocampovet.core.inventory.mapper.ProductSaleModeMapper;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SaleModeService {

    private final ProductSaleModeRepository productSaleModeRepository;
    private final ProductSaleModeMapper productSaleModeMapper;
    SaleModeService( ProductSaleModeRepository productSaleModeRepository, ProductSaleModeMapper productSaleModeMapper){
        this.productSaleModeRepository = productSaleModeRepository;
        this.productSaleModeMapper = productSaleModeMapper;
    }

    public void deleteUnnecessarySaleModes(Product product, ProductUpdateRequest request) {
        Set<Long> updatedIds = request.getSaleModes().stream()
                .map(ProductSaleModeRequest::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (updatedIds.isEmpty()) {
            productSaleModeRepository.deleteAllSaleModesByProductId(product.getId());
        } else {
            productSaleModeRepository.deleteSaleModesNotIn(updatedIds);
        }

        product.getSaleModes().removeIf(saleMode -> saleMode.getId() != null && !updatedIds.contains(saleMode.getId()));
    }

    public void updateOrAddSaleModes(Product product, ProductUpdateRequest request) {
        Set<ProductUnitType> unitTypes = new HashSet<>();
        for (ProductSaleModeRequest req : request.getSaleModes()) {
            if (!unitTypes.add(req.getUnitType())) {
                throw new IllegalArgumentException("No se puede repetir el tipo de unidad en los modos de venta");
            }

            if (req.getId() != null) {
                ProductSaleMode existing = product.getSaleModes().stream()
                        .filter(sm -> req.getId().equals(sm.getId()))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Modo de venta no encontrado"));

                if (!existing.getUnitType().equals(req.getUnitType())) {
                    throw new IllegalArgumentException("No se puede cambiar el tipo de unidad de un modo existente");
                }

                existing.setQuantityEquivalent(req.getQuantityEquivalent());
                existing.setPrice(req.getPrice());
            } else {
                ProductSaleMode newMode = productSaleModeMapper.mapNewSaleMode(product, req);
                product.getSaleModes().add(newMode);
            }
        }
    }
}
