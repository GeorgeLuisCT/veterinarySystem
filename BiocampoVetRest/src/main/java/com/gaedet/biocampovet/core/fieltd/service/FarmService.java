package com.gaedet.biocampovet.core.fieltd.service;

import com.gaedet.biocampovet.core.customer.entity.Customer;
import com.gaedet.biocampovet.core.fieltd.dto.*;
import com.gaedet.biocampovet.core.fieltd.entity.Farm;
import com.gaedet.biocampovet.core.fieltd.entity.GeoZone;
import com.gaedet.biocampovet.core.fieltd.mapper.FarmMapper;
import com.gaedet.biocampovet.core.fieltd.repository.FarmRepository;
import com.gaedet.biocampovet.core.fieltd.specs.FarmSpecs;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FarmService {

    private final FarmRepository farmRepository;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public PaginatedResponse<FarmSummaryResponse> list(
            int page, int size, String q, Long customerId, Long zoneId
    ) {
        Specification<Farm> spec = FarmSpecs.byFilters(q, customerId, zoneId);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("name").ascending());

        Page<Farm> result = farmRepository.findAll(spec, pageable);
        List<FarmSummaryResponse> summaries = result.getContent().stream()
                .map(FarmMapper::toSummary)
                .collect(Collectors.toList());

        return PaginatedResponse.<FarmSummaryResponse>builder()
                .content(summaries)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public FarmResponse getById(Long id) {
        Farm e = farmRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Farm no encontrado: id=" + id));
        return FarmMapper.toResponse(e);
    }

    @Transactional
    public FarmResponse create(CreateFarmRequest r) {
        Long customerId = r.getCustomerId();
        String name = r.getName().trim();
        if (farmRepository.existsByCustomer_IdAndNameIgnoreCase(customerId, name)) {
            throw new IllegalArgumentException("Ya existe una finca con ese nombre para el cliente indicado.");
        }

        Farm e = new Farm();
        e.setCustomer(entityManager.getReference(Customer.class, customerId));
        if (r.getZoneId() != null && r.getZoneId() > 0) {
            e.setZone(entityManager.getReference(GeoZone.class, r.getZoneId()));
        }

        FarmMapper.applyCreate(e, r);
        Farm saved = farmRepository.save(e);
        return FarmMapper.toResponse(saved);
    }

    @Transactional
    public FarmResponse update(Long id, UpdateFarmRequest r) {
        Farm e = farmRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Farm no encontrado: id=" + id));

        Long customerId = r.getCustomerId();
        String newName = r.getName().trim();
        if (!e.getName().equalsIgnoreCase(newName) || !e.getCustomer().getId().equals(customerId)) {
            if (farmRepository.existsByCustomer_IdAndNameIgnoreCaseAndIdNot(customerId, newName, id)) {
                throw new IllegalArgumentException("Ya existe una finca con ese nombre para el cliente indicado.");
            }
        }

        e.setCustomer(entityManager.getReference(Customer.class, customerId));
        if (r.getZoneId() != null && r.getZoneId() > 0) {
            e.setZone(entityManager.getReference(GeoZone.class, r.getZoneId()));
        } else {
            e.setZone(null);
        }

        FarmMapper.applyUpdate(e, r);
        return FarmMapper.toResponse(e);
    }

    @Transactional
    public FarmSummaryResponse delete(Long id) {
        Farm e = farmRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Farm no encontrado: id=" + id));
        FarmSummaryResponse summary = FarmMapper.toSummary(e);
        farmRepository.delete(e);
        return summary;
    }

    @Transactional(readOnly = true)
    public List<FarmQuickSearchResponse> quickSearch(String query, Long zoneId) {
        String normalized = query == null ? "" : query.trim();
        List<Farm> farms;
        if (normalized.isEmpty()) {
            farms = zoneId != null && zoneId > 0
                    ? farmRepository.findTop10ByZone_IdOrderByNameAsc(zoneId)
                    : farmRepository.findTop10ByOrderByNameAsc();
        } else {
            farms = zoneId != null && zoneId > 0
                    ? farmRepository.findTop10ByZone_IdAndNameContainingIgnoreCaseOrderByNameAsc(zoneId, normalized)
                    : farmRepository.findTop10ByNameContainingIgnoreCaseOrderByNameAsc(normalized);
        }
        return farms.stream().map(FarmMapper::toQuickSearch).collect(Collectors.toList());
    }
}
