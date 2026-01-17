package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.clinic.dto.*;
import com.gaedet.veterinarysystem.core.clinic.entity.HealthPlan;
import com.gaedet.veterinarysystem.core.clinic.entity.HealthPlanServiceItem;
import com.gaedet.veterinarysystem.core.clinic.mapper.HealthPlanMapper;
import com.gaedet.veterinarysystem.core.clinic.repository.HealthPlanRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.ClinicalServiceRepository;
import com.gaedet.veterinarysystem.core.clinic.specs.HealthPlanSpecs;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HealthPlanService {

    private final HealthPlanRepository healthPlanRepository;
    private final ClinicalServiceRepository clinicalServiceRepository;

    @Transactional(readOnly = true)
    public PaginatedResponse<HealthPlanResponse> list(int page, int size, String q) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("name").ascending());
        Page<HealthPlan> result = healthPlanRepository.findAll(
                HealthPlanSpecs.byFilters(q),
                pageable
        );

        List<HealthPlanResponse> responses = result.getContent().stream()
                .map(HealthPlanMapper::toResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<HealthPlanResponse>builder()
                .content(responses)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public HealthPlanResponse getById(Long id) {
        HealthPlan plan = healthPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("HealthPlan no encontrado: id=" + id));
        return HealthPlanMapper.toResponse(plan);
    }

    @Transactional
    public HealthPlanResponse create(CreateHealthPlanRequest request) {
        String normalizedName = request.getName().trim();
        if (healthPlanRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new IllegalArgumentException("Ya existe un plan de salud con ese nombre.");
        }

        HealthPlan plan = new HealthPlan();
        HealthPlanMapper.applyCreate(plan, request);
        overwriteServiceItems(plan, request.getServiceItems());

        HealthPlan saved = healthPlanRepository.save(plan);
        return HealthPlanMapper.toResponse(saved);
    }

    @Transactional
    public HealthPlanResponse update(Long id, UpdateHealthPlanRequest request) {
        HealthPlan plan = healthPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("HealthPlan no encontrado: id=" + id));

        String normalizedName = request.getName().trim();
        if (!plan.getName().equalsIgnoreCase(normalizedName)
                && healthPlanRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new IllegalArgumentException("Ya existe un plan de salud con ese nombre.");
        }

        HealthPlanMapper.applyUpdate(plan, request);
        overwriteServiceItems(plan, request.getServiceItems());

        return HealthPlanMapper.toResponse(plan);
    }

    @Transactional
    public HealthPlanResponse delete(Long id) {
        HealthPlan plan = healthPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("HealthPlan no encontrado: id=" + id));

        HealthPlanResponse response = HealthPlanMapper.toResponse(plan);
        healthPlanRepository.delete(plan);
        return response;
    }

    private void overwriteServiceItems(HealthPlan plan, List<HealthPlanServiceItemRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException("Debe registrar al menos un servicio en el plan.");
        }

        Map<Long, ClinicalService> servicesById = fetchServices(requests);

        List<HealthPlanServiceItem> targetList = plan.getServiceItems();
        if (targetList == null) {
            targetList = new ArrayList<>();
            plan.setServiceItems(targetList);
        }

        targetList.clear();

        for (HealthPlanServiceItemRequest request : requests) {
            ClinicalService clinicalService = servicesById.get(request.getClinicalServiceId());
            if (clinicalService == null) {
                throw new IllegalArgumentException("Servicio clínico no encontrado: id=" + request.getClinicalServiceId());
            }

            HealthPlanServiceItem item = HealthPlanServiceItem.builder()
                    .healthPlan(plan)
                    .clinicalService(clinicalService)
                    .quantity(request.getQuantity())
                    .notes(normalizeNullable(request.getNotes()))
                    .build();

            targetList.add(item);
        }
    }

    private Map<Long, ClinicalService> fetchServices(List<HealthPlanServiceItemRequest> requests) {
        Set<Long> ids = requests.stream()
                .map(HealthPlanServiceItemRequest::getClinicalServiceId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }

        List<ClinicalService> services = clinicalServiceRepository.findAllById(ids);
        Map<Long, ClinicalService> servicesById = services.stream()
                .collect(Collectors.toMap(ClinicalService::getId, service -> service));

        Set<Long> missing = new HashSet<>(ids);
        missing.removeAll(servicesById.keySet());
        if (!missing.isEmpty()) {
            throw new IllegalArgumentException("Servicios clínicos no encontrados: " + missing);
        }

        return servicesById;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
