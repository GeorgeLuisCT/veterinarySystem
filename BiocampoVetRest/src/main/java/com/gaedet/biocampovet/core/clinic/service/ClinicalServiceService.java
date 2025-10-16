package com.gaedet.biocampovet.core.clinic.service;

import com.gaedet.biocampovet.core.branches.dto.BranchActivationInput;
import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.branches.repository.BranchRepository;
import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.entity.BranchClinicalService;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalService;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.biocampovet.core.clinic.mapper.ClinicalServiceMapper;
import com.gaedet.biocampovet.core.clinic.repository.BranchClinicalServiceRepository;
import com.gaedet.biocampovet.core.clinic.repository.ClinicalServiceRepository;
import com.gaedet.biocampovet.core.clinic.specs.ClinicalServiceSpecs;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClinicalServiceService {

    private final ClinicalServiceRepository clinicalServiceRepository;
    private final BranchClinicalServiceRepository branchClinicalServiceRepository;
    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public PaginatedResponse<ClinicalServiceSummaryResponse> list(
            int page, int size, String q, ClinicalServiceCategory category, Long branchIdOrZero
    ) {
        Specification<ClinicalService> spec = ClinicalServiceSpecs.byFilters(q, category, branchIdOrZero);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("name").ascending());

        Page<ClinicalService> result = clinicalServiceRepository.findAll(spec, pageable);

        List<ClinicalServiceSummaryResponse> summaries = result.getContent().stream()
                .map(ClinicalServiceMapper::toSummary)
                .collect(Collectors.toList());

        return PaginatedResponse.<ClinicalServiceSummaryResponse>builder()
                .content(summaries)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public ClinicalServiceResponse getById(Long id) {
        ClinicalService e = clinicalServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ClinicalService no encontrado: id=" + id));
        return ClinicalServiceMapper.toResponse(e);
    }

    @Transactional
    public ClinicalServiceResponse create(CreateClinicalServiceRequest r) {
        if (clinicalServiceRepository.existsByNameIgnoreCase(r.getName())) {
            throw new IllegalArgumentException("Ya existe un servicio con ese nombre.");
        }

        ClinicalService e = new ClinicalService();
        ClinicalServiceMapper.applyCreate(e, r);
        syncRequiredProducts(e, r.getRequiredProductIds());

        syncBranchLinks(e, r.getBranches());

        ClinicalService saved = clinicalServiceRepository.save(e);
        return ClinicalServiceMapper.toResponse(saved);
    }

    @Transactional
    public ClinicalServiceResponse update(Long id, UpdateClinicalServiceRequest r) {
        ClinicalService e = clinicalServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ClinicalService no encontrado: id=" + id));

        String newName = r.getName().trim();
        if (!e.getName().equalsIgnoreCase(newName) && clinicalServiceRepository.existsByNameIgnoreCase(newName)) {
            throw new IllegalArgumentException("Ya existe un servicio con ese nombre.");
        }

        ClinicalServiceMapper.applyUpdate(e, r);
        syncRequiredProducts(e, r.getRequiredProductIds());

        if (r.getBranches() != null) {
            syncBranchLinks(e, r.getBranches());
        }

        return ClinicalServiceMapper.toResponse(e);
    }

    @Transactional
    public ClinicalServiceSummaryResponse delete(Long id) {
        ClinicalService e = clinicalServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ClinicalService no encontrado: id=" + id));

        ClinicalServiceSummaryResponse summary = ClinicalServiceMapper.toSummary(e);

        clinicalServiceRepository.delete(e);
        return summary;
    }

    @Transactional
    public ClinicalServiceSummaryResponse setBranchActivation(Long serviceId, Long branchId, boolean active) {
        ClinicalService service = clinicalServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("ClinicalService no encontrado: id=" + serviceId));

        Optional<BranchClinicalService> optionalLink =
                branchClinicalServiceRepository.findByBranchIdAndClinicalServiceId(branchId, serviceId);

        BranchClinicalService link = optionalLink.orElseGet(() ->
                BranchClinicalService.builder()
                        .branch(Branch.builder().id(branchId).build())
                        .clinicalService(service)
                        .isActive(true)
                        .build()
        );

        link.setActive(active);

        if (link.getClinicalService() == null) {
            link.setClinicalService(service);
        }
        if (link.getBranch() == null) {
            link.setBranch(Branch.builder().id(branchId).build());
        }

        service.getBranchLinks().add(link);
        branchClinicalServiceRepository.save(link);

        return ClinicalServiceMapper.toSummary(service);
    }

    private void syncRequiredProducts(ClinicalService clinicalService, Set<Long> requestedProductIds) {
        clinicalService.getRequiredProducts().clear();

        if (requestedProductIds == null || requestedProductIds.isEmpty()) {
            return;
        }

        Set<Long> normalizedIds = requestedProductIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (normalizedIds.isEmpty()) {
            return;
        }

        List<Product> products = productRepository.findAllById(normalizedIds);
        Set<Long> foundIds = products.stream()
                .map(Product::getId)
                .collect(Collectors.toSet());

        Set<Long> missingIds = new HashSet<>(normalizedIds);
        missingIds.removeAll(foundIds);

        if (!missingIds.isEmpty()) {
            throw new IllegalArgumentException("Productos requeridos no encontrados: " + missingIds);
        }

        clinicalService.getRequiredProducts().addAll(products);
    }

    private void syncBranchLinks(ClinicalService service, List<BranchActivationInput> branchInputs) {
        Map<Long, Boolean> requestedStates = branchInputs == null
                ? Map.of()
                : branchInputs.stream()
                .collect(Collectors.toMap(
                        BranchActivationInput::getBranchId,
                        bi -> Boolean.TRUE.equals(bi.getActive()),
                        (existing, replacement) -> replacement
                ));

        List<Branch> allBranches = branchRepository.findAll();
        Set<Long> existingBranchIds = allBranches.stream()
                .map(Branch::getId)
                .collect(Collectors.toSet());

        Set<Long> unknownBranchIds = new HashSet<>(requestedStates.keySet());
        unknownBranchIds.removeAll(existingBranchIds);
        if (!unknownBranchIds.isEmpty()) {
            throw new IllegalArgumentException("Sucursales no existen: " + unknownBranchIds);
        }

        if (service.getBranchLinks() == null) {
            service.setBranchLinks(new HashSet<>());
        }

        Map<Long, BranchClinicalService> currentLinks = service.getBranchLinks().stream()
                .collect(Collectors.toMap(
                        link -> link.getBranch().getId(),
                        link -> link
                ));

        for (Branch branch : allBranches) {
            boolean active = requestedStates.getOrDefault(branch.getId(), false);
            BranchClinicalService link = currentLinks.get(branch.getId());
            if (link == null) {
                link = BranchClinicalService.builder()
                        .branch(branch)
                        .clinicalService(service)
                        .isActive(active)
                        .build();
                service.getBranchLinks().add(link);
            } else {
                link.setActive(active);
            }
        }

        service.getBranchLinks().removeIf(link -> !existingBranchIds.contains(link.getBranch().getId()));
    }

    @Transactional(readOnly = true)
    public List<ClinicalServiceQuickSearchResponse> quickSearch(String name, Long branchId) {
        String searchQuery = (name == null || name.isBlank()) ? null : name.trim();
        Long formattedBranchId = (branchId == null || branchId == 0) ? null : branchId;

        List<Object[]> rawResults = clinicalServiceRepository.quickClinicalServiceSearch(
                searchQuery,
                formattedBranchId,
                Boolean.TRUE
        );

        return rawResults.stream()
                .map(ClinicalServiceQuickSearchResponse::fromNativeRow)
                .collect(Collectors.toList());
    }
}
