package com.gaedet.veterinarysystem.core.inventory.service;

import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.inventory.dto.*;
import com.gaedet.veterinarysystem.core.inventory.entity.*;
import com.gaedet.veterinarysystem.core.inventory.mapper.SupplierMapper;
import com.gaedet.veterinarysystem.core.inventory.repository.SupplierRepository;
import com.gaedet.veterinarysystem.core.inventory.specs.SupplierSpecs;
import com.gaedet.veterinarysystem.exeption.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;
import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @Transactional
    public SupplierSummaryResponse createSupplier(SupplierCreateRequest request) {
        if (supplierRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("El correo electrónico ya está en uso");
        }

        Supplier supplier = SupplierMapper.toEntity(request);
        supplierRepository.save(supplier);

        return SupplierMapper.toSummary(supplier);
    }

    public SupplierResponse getSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        return SupplierMapper.toResponse(supplier);
    }

    public PaginatedResponse<SupplierSummaryResponse> getSuppliers(int page, int size, Boolean isActive, String supplierType, String query) {

        Specification<Supplier> spec = SupplierSpecs.byFilters(query, supplierType, isActive);

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("name").ascending());

        Page<Supplier> result = supplierRepository.findAll(spec, pageable);

        List<SupplierSummaryResponse> content = result.getContent().stream()
                .map(SupplierMapper::toSummary)
                .toList();

        return PaginatedResponse.<SupplierSummaryResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
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

        SupplierMapper.updateEntity(supplier, request);
        supplierRepository.save(supplier);

        return SupplierMapper.toSummary(supplier);
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

        return SupplierMapper.toSummary(supplier);
    }

    @Transactional
    public void hardDeleteSupplier(Long supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new RuntimeException("Proveedor no encontrado");
        }
        supplierRepository.deleteById(supplierId);
    }
}