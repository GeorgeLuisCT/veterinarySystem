package com.gaedet.veterinarysystem.core.inventory.service;

import com.gaedet.veterinarysystem.core.inventory.dto.KardexRegistrationRequest;
import com.gaedet.veterinarysystem.core.inventory.entity.KardexMovement;
import com.gaedet.veterinarysystem.core.inventory.entity.ProductBatch;
import com.gaedet.veterinarysystem.core.inventory.enums.KardexMovementType;
import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import com.gaedet.veterinarysystem.core.inventory.repository.KardexMovementRepository;
import com.gaedet.veterinarysystem.core.inventory.repository.ProductBatchRepository;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import com.gaedet.veterinarysystem.exeption.InsufficientStockException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Consumo de inventario por servicios (hospitalización, procedimientos): descuenta por lotes
 * respetando el vencimiento (FEFO), reparte entre lotes si hace falta y falla de forma explícita
 * cuando no hay stock suficiente. También permite devolver lo consumido.
 */
@Service
@RequiredArgsConstructor
public class InventoryConsumptionService {

    private static final String RETURN_SUFFIX = "_RETURN";

    private final KardexService kardexService;
    private final ProductBatchRepository productBatchRepository;
    private final KardexMovementRepository kardexMovementRepository;

    /**
     * @param quantity   cantidad en la unidad indicada (si unit es null se asume la unidad base del producto)
     * @param originType identifica el consumo para poder revertirlo (p. ej. "TreatmentSchedule")
     */
    @Transactional
    public void consume(Long productId, Long branchId, BigDecimal quantity, ProductUnitType unit,
                        String originType, Long originId) {
        if (branchId == null) {
            throw new BadRequestException("No se puede descontar inventario sin sucursal");
        }
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("La cantidad a consumir debe ser mayor a cero");
        }

        BigDecimal remaining = kardexService.convertToBaseUnit(productId, quantity, unit);

        Map<Long, BigDecimal> stockByBatch = kardexService.getStockForProductByBatch(productId, branchId);
        List<ProductBatch> batches = productBatchRepository
                .findAllByProductIdAndExpirationDateGreaterThanEqualOrderByExpirationDateAsc(productId, LocalDate.now());

        BigDecimal available = batches.stream()
                .map(b -> stockByBatch.getOrDefault(b.getId(), BigDecimal.ZERO).max(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (available.compareTo(remaining) < 0) {
            throw new InsufficientStockException("Stock insuficiente (lotes vigentes) para el producto #" + productId
                    + ": se necesitan " + remaining + " y hay " + available);
        }

        for (ProductBatch batch : batches) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            BigDecimal inBatch = stockByBatch.getOrDefault(batch.getId(), BigDecimal.ZERO);
            if (inBatch.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }
            BigDecimal take = inBatch.min(remaining);
            kardexService.registerMovement(KardexRegistrationRequest.builder()
                    .productId(productId)
                    .branchId(branchId)
                    .batchId(batch.getId())
                    .quantity(take)
                    .unitType(null) // ya está en unidad base
                    .type(KardexMovementType.SERVICE_EXIT)
                    .originId(originId)
                    .originType(originType)
                    .build());
            remaining = remaining.subtract(take);
        }
    }

    /**
     * Devuelve al inventario, lote por lote, lo que aún esté consumido para ese origen
     * (consumos menos devoluciones previas): es idempotente.
     */
    @Transactional
    public void restore(String originType, Long originId) {
        List<KardexMovement> movements = kardexMovementRepository
                .findByOrigin(Set.of(originType, originType + RETURN_SUFFIX), originId);

        // key = producto|sucursal|lote -> neto consumido (negativo = consumo pendiente de devolver)
        Map<String, BigDecimal> net = new HashMap<>();
        Map<String, KardexMovement> sample = new HashMap<>();
        for (KardexMovement m : movements) {
            String key = m.getProduct().getId() + "|" + m.getBranch().getId() + "|" + m.getBatch().getId();
            net.merge(key, m.getQuantity(), BigDecimal::add);
            sample.putIfAbsent(key, m);
        }

        net.forEach((key, balance) -> {
            if (balance.compareTo(BigDecimal.ZERO) >= 0) {
                return;
            }
            KardexMovement ref = sample.get(key);
            kardexService.registerMovement(KardexRegistrationRequest.builder()
                    .productId(ref.getProduct().getId())
                    .branchId(ref.getBranch().getId())
                    .batchId(ref.getBatch().getId())
                    .quantity(balance.negate())
                    .unitType(null)
                    .type(KardexMovementType.SERVICE_RETURN_ENTRY)
                    .originId(originId)
                    .originType(originType + RETURN_SUFFIX)
                    .build());
        });
    }
}
