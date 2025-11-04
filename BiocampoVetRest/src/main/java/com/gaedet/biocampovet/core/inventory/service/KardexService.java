package com.gaedet.biocampovet.core.inventory.service;

import com.gaedet.biocampovet.core.inventory.dto.KardexRegistrationRequest;
import com.gaedet.biocampovet.core.inventory.entity.*;
import com.gaedet.biocampovet.core.inventory.enums.KardexMovementType;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.inventory.repository.*;
import com.gaedet.biocampovet.core.inventory.util.UnitConversionUtil;
import com.gaedet.biocampovet.exeption.BadRequestException;
import com.gaedet.biocampovet.exeption.InsufficientStockException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    @Transactional(readOnly = true)
    public BigDecimal convertToBaseUnit(Long productId, BigDecimal quantity, ProductUnitType unitType) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado para conversión de unidades"));
        return convertToBaseUnit(product, quantity, unitType);
    }

    private BigDecimal convertToBaseUnit(Product product, BigDecimal quantity, ProductUnitType unitType) {

        if (unitType == null || unitType.equals(product.getUnitType())) {
            return quantity;
        }

        if (unitType.isFracionable()) {

            ProductUnitType baseUnit = product.getUnitType(); // ej. KILOGRAM

            Map<ProductUnitType, Double> factors = new HashMap<>();
            UnitConversionUtil.populateEquivalentsMap(factors, baseUnit);

            Double factor = factors.get(unitType);

            if (factor == null) {
                throw new BadRequestException("No se encontró un factor de conversión física de " + unitType + " a " + baseUnit);
            }

            return quantity.multiply(BigDecimal.valueOf(factor));

        } else {

            ProductSaleMode saleMode = productSaleModeRepository
                    .findByProductIdAndUnitType(product.getId(), unitType)
                    .orElseThrow(() -> new BadRequestException("Modo de venta no válido '" + unitType + "' para el producto '" + product.getName() + "'"));

            return quantity.multiply(BigDecimal.valueOf(saleMode.getQuantityEquivalent()));
        }
    }

    @Transactional(readOnly = true)
    public Map<Long, BigDecimal> getStockForProducts(List<Long> productIds, Long branchId) {

        List<ProductStockAggregate> aggregates;

        if (branchId != null) {
            aggregates = kardexMovementRepository.findTotalStockByProductIdsAndBranch(productIds, branchId);
        } else {
            aggregates = kardexMovementRepository.findTotalStockByProductIds(productIds);
        }

        return aggregates.stream()
                .collect(Collectors.toMap(
                        ProductStockAggregate::getProductId,
                        ProductStockAggregate::getTotalStock
                ));
    }

    @Transactional(readOnly = true)
    public Map<Long, Map<Long, BigDecimal>> getAggregatedBranchStock(List<Long> productIds) {

        List<ProductBranchStockAggregate> aggregates = kardexMovementRepository
                .findAggregatedBranchStockByProductIds(productIds);

        return aggregates.stream()
                .collect(Collectors.groupingBy(
                        ProductBranchStockAggregate::getProductId,
                        Collectors.toMap(
                                ProductBranchStockAggregate::getBranchId,
                                ProductBranchStockAggregate::getTotalStock
                        )
                ));
    }

    @Transactional(readOnly = true)
    public BigDecimal getCurrentStock(Long productId, Long branchId, Long batchId) {
        if (batchId == null) {
            return kardexMovementRepository
                    .findCurrentStockByProductAndBranchWithoutBatch(productId, branchId)
                    .orElse(BigDecimal.ZERO);
        }
        return kardexMovementRepository
                .findCurrentStockByProductAndBranchAndBatch(productId, branchId, batchId)
                .orElse(BigDecimal.ZERO);
    }

    @Transactional(readOnly = true)
    public Map<Long, BigDecimal> getStockForProductByBatch(Long productId, Long branchId) {

        return kardexMovementRepository.findStockByProductAndBranchGroupedByBatch(productId, branchId)
                .stream()
                .collect(Collectors.toMap(
                        ProductBatchStockAggregate::getBatchId,
                        ProductBatchStockAggregate::getTotalStock
                ));
    }
}
