package com.gaedet.biocampovet.core.sales.service;

import com.gaedet.biocampovet.core.cash.entity.Cashbox;
import com.gaedet.biocampovet.core.cash.enums.CashBoxStatus;
import com.gaedet.biocampovet.core.cash.repository.CashboxRepository;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.service.InventoryMovementService;
import com.gaedet.biocampovet.core.sales.dto.SaleRequest;
import com.gaedet.biocampovet.core.sales.dto.SaleResponse;
import com.gaedet.biocampovet.core.sales.dto.SaleSummaryResponse;
import com.gaedet.biocampovet.core.sales.entity.Sale;
import com.gaedet.biocampovet.core.sales.mapper.SaleMapperRequests;
import com.gaedet.biocampovet.core.sales.mapper.SaleMapperResponses;
import com.gaedet.biocampovet.core.sales.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final SaleMapperRequests saleMapperRequests;
    private final SaleMapperResponses saleMapperResponses;
    private final InventoryMovementService inventoryMovementService;
    private final CashboxRepository cashBoxRepository;


    @Transactional
    public Long createSale(SaleRequest request, Long branchId, Long employeeId) {
        try {
            Cashbox cashBox = cashBoxRepository
                    .findByBranchIdAndStatus(branchId, CashBoxStatus.OPEN)
                    .orElseThrow(() -> new RuntimeException("No hay caja abierta para la sucursal."));

            Sale sale = saleMapperRequests.toEntity(request, cashBox, branchId, employeeId);

            Sale savedSale = saleRepository.save(sale);

            if (request.getSaleProducts() != null && !request.getSaleProducts().isEmpty()) {
                inventoryMovementService.registerSaleMovement(request, branchId, employeeId);
            }
            return savedSale.getId();
        } catch (Exception e) {
            throw new RuntimeException("Error al crear la venta: " + e.getMessage(), e);
        }
    }

    public SaleResponse getSaleById(Long id) {
        Sale sale = saleRepository.findDetailedById(id)
                .orElseThrow(() -> new NoSuchElementException("Venta no encontrada con ID: " + id));
        return saleMapperResponses.toResponse(sale);
    }

    public PaginatedResponse<SaleSummaryResponse> getSaleSummaries(
            int page,
            int size,
            Long branchId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Las fechas de inicio y fin son obligatorias");
        }

        Long safeBranchId = (branchId == null || branchId == 0) ? null : branchId;
        Pageable pageable = PageRequest.of(page, size);

        Page<Object[]> rawPage = saleRepository.findSaleSummaryByBranchAndDate(
                safeBranchId,
                startDate,
                endDate,
                pageable
        );

        Page<SaleSummaryResponse> summaryPage = rawPage.map(SaleSummaryResponse::fromNativeRow);

        return PaginatedResponse.<SaleSummaryResponse>builder()
                .content(summaryPage.getContent())
                .totalPages(summaryPage.getTotalPages())
                .totalElements(summaryPage.getTotalElements())
                .currentPage(summaryPage.getNumber())
                .pageSize(summaryPage.getSize())
                .build();
    }
}
