package com.gaedet.biocampovet.core.inventory.service;

import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.dto.*;
import com.gaedet.biocampovet.core.inventory.entity.*;
import com.gaedet.biocampovet.core.inventory.mapper.SupplierMapper;
import com.gaedet.biocampovet.core.inventory.repository.SupplierRepository;
import com.gaedet.biocampovet.exeption.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;

    public SupplierService(SupplierRepository supplierRepository,
                           SupplierMapper supplierMapper) {
        this.supplierRepository = supplierRepository;
        this.supplierMapper = supplierMapper;
    }

    @Transactional
    public SupplierSummaryResponse createSupplier(SupplierCreateRequest request) {
        if (supplierRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El correo electrónico ya está en uso");
        }

        Supplier supplier = supplierMapper.toEntity(request);
        supplierRepository.save(supplier);

        return supplierMapper.toSummaryResponse(supplier);
    }

    public SupplierResponse getSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        return supplierMapper.toResponse(supplier);
    }

    public PaginatedResponse<SupplierSummaryResponse> getSuppliers(int page, int size, Boolean isActive, String supplierType, String query) {
        Pageable pageable = PageRequest.of(page, size);
        String searchQuery = (query == null || query.isBlank()) ? null : query.trim();
        String type = (supplierType == null || supplierType.isBlank()) ? null : supplierType.trim().toUpperCase();

        Page<Object[]> rawPage = supplierRepository.findSupplierSummary(searchQuery, type, isActive, pageable);
        Page<SupplierSummaryResponse> summaryPage = rawPage.map(SupplierSummaryResponse::fromNativeRow);

        return PaginatedResponse.<SupplierSummaryResponse>builder()
                .content(summaryPage.getContent())
                .totalPages(summaryPage.getTotalPages())
                .totalElements(summaryPage.getTotalElements())
                .currentPage(summaryPage.getNumber())
                .pageSize(summaryPage.getSize())
                .build();
    }

    public List<SupplierQuickSearchResponse> searchSuppliers(String query) {
        String searchQuery = (query == null || query.isBlank()) ? null : query.trim();
        List<Object[]> rawResults = supplierRepository.quickSupplierSearch(searchQuery, true);
        return rawResults.stream()
                .map(SupplierQuickSearchResponse::fromNativeRow)
                .toList();
    }

    @Transactional
    public SupplierSummaryResponse updateSupplier(SupplierUpdateRequest request) {
        Supplier supplier = supplierRepository.findById(request.getId())
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));

        if (supplierRepository.existsByEmailAndIdNot(request.getEmail(), request.getId())) {
            throw new BadRequestException("El correo electrónico ya está en uso por otro proveedor");
        }

        supplierMapper.updateEntity(supplier, request);
        supplierRepository.save(supplier);

        return supplierMapper.toSummaryResponse(supplier);
    }

    @Transactional
    public void softDeleteSupplier(Long supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));

        supplier.setActive(false);
        supplierRepository.save(supplier);
    }

    @Transactional
    public SupplierSummaryResponse restoreSupplier(Long supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));

        supplier.setActive(true);
        supplierRepository.save(supplier);

        return supplierMapper.toSummaryResponse(supplier);
    }

    @Transactional
    public void hardDeleteSupplier(Long supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new RuntimeException("Proveedor no encontrado");
        }
        supplierRepository.deleteById(supplierId);
    }
}