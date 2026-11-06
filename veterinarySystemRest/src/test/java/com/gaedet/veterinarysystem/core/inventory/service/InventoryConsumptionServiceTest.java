package com.gaedet.veterinarysystem.core.inventory.service;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.inventory.dto.KardexRegistrationRequest;
import com.gaedet.veterinarysystem.core.inventory.entity.KardexMovement;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;
import com.gaedet.veterinarysystem.core.inventory.entity.ProductBatch;
import com.gaedet.veterinarysystem.core.inventory.enums.KardexMovementType;
import com.gaedet.veterinarysystem.core.inventory.repository.KardexMovementRepository;
import com.gaedet.veterinarysystem.core.inventory.repository.ProductBatchRepository;
import com.gaedet.veterinarysystem.exeption.InsufficientStockException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryConsumptionServiceTest {

    @Mock KardexService kardexService;
    @Mock ProductBatchRepository batchRepository;
    @Mock KardexMovementRepository movementRepository;

    private ProductBatch batch(long id, String number) {
        ProductBatch b = new ProductBatch();
        b.setId(id);
        b.setBatchNumber(number);
        b.setExpirationDate(LocalDate.now().plusMonths(id));
        return b;
    }

    private InventoryConsumptionService service() {
        return new InventoryConsumptionService(kardexService, batchRepository, movementRepository);
    }

    @Test
    void consumesOldestExpiringBatchFirstAndSplitsAcrossBatches() {
        when(kardexService.convertToBaseUnit(7L, new BigDecimal("8"), null)).thenReturn(new BigDecimal("8"));
        when(kardexService.getStockForProductByBatch(7L, 1L))
                .thenReturn(Map.of(1L, new BigDecimal("5"), 2L, new BigDecimal("10")));
        // Orden FEFO: lote 1 vence antes que el 2
        when(batchRepository.findAllByProductIdAndExpirationDateGreaterThanEqualOrderByExpirationDateAsc(eq(7L), any()))
                .thenReturn(List.of(batch(1L, "A"), batch(2L, "B")));

        service().consume(7L, 1L, new BigDecimal("8"), null, "TreatmentSchedule", 50L);

        ArgumentCaptor<KardexRegistrationRequest> captor = ArgumentCaptor.forClass(KardexRegistrationRequest.class);
        verify(kardexService, times(2)).registerMovement(captor.capture());
        assertEquals(1L, captor.getAllValues().get(0).getBatchId());
        assertEquals(new BigDecimal("5"), captor.getAllValues().get(0).getQuantity());
        assertEquals(2L, captor.getAllValues().get(1).getBatchId());
        assertEquals(new BigDecimal("3"), captor.getAllValues().get(1).getQuantity());
        assertEquals(KardexMovementType.SERVICE_EXIT, captor.getAllValues().get(0).getType());
    }

    @Test
    void failsWithoutMovingAnythingWhenStockIsInsufficient() {
        when(kardexService.convertToBaseUnit(7L, new BigDecimal("20"), null)).thenReturn(new BigDecimal("20"));
        when(kardexService.getStockForProductByBatch(7L, 1L)).thenReturn(Map.of(1L, new BigDecimal("5")));
        when(batchRepository.findAllByProductIdAndExpirationDateGreaterThanEqualOrderByExpirationDateAsc(eq(7L), any()))
                .thenReturn(List.of(batch(1L, "A")));

        assertThrows(InsufficientStockException.class,
                () -> service().consume(7L, 1L, new BigDecimal("20"), null, "TreatmentSchedule", 50L));

        verify(kardexService, never()).registerMovement(any());
    }

    private KardexMovement movement(long batchId, String qty, KardexMovementType type) {
        Product product = new Product();
        product.setId(7L);
        Branch branch = new Branch();
        branch.setId(1L);
        return KardexMovement.builder().product(product).branch(branch).batch(batch(batchId, "L" + batchId))
                .quantity(new BigDecimal(qty)).type(type).build();
    }

    @Test
    void restoreReturnsOnlyWhatIsStillConsumed() {
        when(movementRepository.findByOrigin(Set.of("TreatmentSchedule", "TreatmentSchedule_RETURN"), 50L))
                .thenReturn(List.of(
                        movement(1L, "-5", KardexMovementType.SERVICE_EXIT),
                        movement(2L, "-3", KardexMovementType.SERVICE_EXIT),
                        // el lote 2 ya fue devuelto antes: neto 0
                        movement(2L, "3", KardexMovementType.SERVICE_RETURN_ENTRY)));

        service().restore("TreatmentSchedule", 50L);

        ArgumentCaptor<KardexRegistrationRequest> captor = ArgumentCaptor.forClass(KardexRegistrationRequest.class);
        verify(kardexService, times(1)).registerMovement(captor.capture());
        assertEquals(1L, captor.getValue().getBatchId());
        assertEquals(new BigDecimal("5"), captor.getValue().getQuantity());
        assertEquals(KardexMovementType.SERVICE_RETURN_ENTRY, captor.getValue().getType());
    }
}
