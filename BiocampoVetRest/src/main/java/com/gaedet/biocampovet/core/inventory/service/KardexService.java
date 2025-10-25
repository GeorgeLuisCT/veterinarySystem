package com.gaedet.biocampovet.core.inventory.service;

import com.gaedet.biocampovet.core.inventory.dto.KardexRegistrationRequest;
import com.gaedet.biocampovet.core.inventory.entity.*;
import com.gaedet.biocampovet.core.inventory.enums.KardexMovementType;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.inventory.repository.KardexMovementRepository;
import com.gaedet.biocampovet.core.inventory.repository.ProductBranchRepository;
import com.gaedet.biocampovet.core.inventory.repository.ProductRepository;
import com.gaedet.biocampovet.core.inventory.repository.ProductSaleModeRepository;
import com.gaedet.biocampovet.exeption.BadRequestException;
import com.gaedet.biocampovet.exeption.InsufficientStockException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class KardexService {

    private final KardexMovementRepository kardexMovementRepository;
    private final ProductRepository productRepository;
    private final ProductBranchRepository productBranchStockRepository;
    private final ProductSaleModeRepository productSaleModeRepository;
    private final EntityManager entityManager;

    @Transactional
    public void registerMovement(KardexRegistrationRequest request) {

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado para Kardex"));

        BigDecimal baseQuantity = convertToBaseUnit(
                product,
                request.getQuantity(),
                request.getUnitType()
        );

        if (request.getType().isExit()) {
            baseQuantity = baseQuantity.negate();
        }

        ProductBranch pbs = productBranchStockRepository
                .findByProductIdAndBranchId(request.getProductId(), request.getBranchId())
                .orElseThrow(() -> new RuntimeException("Producto no configurado en la sucursal"));

        if (!pbs.isActive()) {
            throw new BadRequestException("El producto no está activo en esta sucursal");
        }

        BigDecimal currentStock = kardexMovementRepository
                .findCurrentStockByProductAndBranchAndBatch(
                        request.getProductId(),
                        request.getBranchId(),
                        request.getBatchId())
                .orElse(BigDecimal.ZERO);

        BigDecimal resultingStock = currentStock.add(baseQuantity);

        if (resultingStock.compareTo(BigDecimal.ZERO) < 0) {
            throw new InsufficientStockException("Stock insuficiente para el producto: " + product.getName());
        }

        KardexMovement movement = KardexMovement.builder()
                .product(product)
                .branch(pbs.getBranch())
                .batch(entityManager.getReference(ProductBatch.class, request.getBatchId()))
                .date(LocalDateTime.now())
                .type(request.getType())
                .quantity(baseQuantity)
                .resultingStock(resultingStock)
                .originId(request.getOriginId())
                .originType(request.getOriginType())
                .build();

        kardexMovementRepository.save(movement);
    }

    public BigDecimal getCurrentStock(Long productId, Long branchId) {
        return kardexMovementRepository
                .findCurrentStockByProductAndBranch(productId, branchId)
                .orElse(BigDecimal.ZERO);
    }

    private BigDecimal convertToBaseUnit(Product product, BigDecimal quantity, ProductUnitType unitType) {
        if (unitType == null || unitType.equals(product.getUnitType())) {
            return quantity;
        }

        ProductSaleMode saleMode = productSaleModeRepository
                .findByProductIdAndUnitType(product.getId(), unitType) // CORREGIDO
                .orElseThrow(() -> new BadRequestException("Modo de venta no válido para la conversión de unidades"));

        return quantity.multiply(BigDecimal.valueOf(saleMode.getQuantityEquivalent()));
    }
}