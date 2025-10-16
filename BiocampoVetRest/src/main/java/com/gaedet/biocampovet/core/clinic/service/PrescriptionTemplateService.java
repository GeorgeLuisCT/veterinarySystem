package com.gaedet.biocampovet.core.clinic.service;

import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.entity.PrescriptionTemplate;
import com.gaedet.biocampovet.core.clinic.entity.PrescriptionTemplateMedication;
import com.gaedet.biocampovet.core.clinic.mapper.PrescriptionTemplateMapper;
import com.gaedet.biocampovet.core.clinic.repository.PrescriptionTemplateRepository;
import com.gaedet.biocampovet.core.clinic.specs.PrescriptionTemplateSpecs;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.repository.ProductRepository;
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
public class PrescriptionTemplateService {

    private final PrescriptionTemplateRepository prescriptionTemplateRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public PaginatedResponse<PrescriptionTemplateResponse> list(int page, int size, String q) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("name").ascending());
        Page<PrescriptionTemplate> result = prescriptionTemplateRepository.findAll(
                PrescriptionTemplateSpecs.byFilters(q),
                pageable
        );

        List<PrescriptionTemplateResponse> templates = result.getContent().stream()
                .map(PrescriptionTemplateMapper::toResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<PrescriptionTemplateResponse>builder()
                .content(templates)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public PrescriptionTemplateResponse getById(Long id) {
        PrescriptionTemplate template = prescriptionTemplateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PrescriptionTemplate no encontrado: id=" + id));
        return PrescriptionTemplateMapper.toResponse(template);
    }

    @Transactional
    public PrescriptionTemplateResponse create(CreatePrescriptionTemplateRequest request) {
        String normalizedName = request.getName().trim();
        if (prescriptionTemplateRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new IllegalArgumentException("Ya existe una plantilla de receta con ese nombre.");
        }

        PrescriptionTemplate template = new PrescriptionTemplate();
        PrescriptionTemplateMapper.applyCreate(template, request);
        overwriteMedications(template, request.getMedications());

        PrescriptionTemplate saved = prescriptionTemplateRepository.save(template);
        return PrescriptionTemplateMapper.toResponse(saved);
    }

    @Transactional
    public PrescriptionTemplateResponse update(Long id, UpdatePrescriptionTemplateRequest request) {
        PrescriptionTemplate template = prescriptionTemplateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PrescriptionTemplate no encontrado: id=" + id));

        String normalizedName = request.getName().trim();
        if (!template.getName().equalsIgnoreCase(normalizedName)
                && prescriptionTemplateRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new IllegalArgumentException("Ya existe una plantilla de receta con ese nombre.");
        }

        PrescriptionTemplateMapper.applyUpdate(template, request);
        overwriteMedications(template, request.getMedications());

        return PrescriptionTemplateMapper.toResponse(template);
    }

    @Transactional
    public PrescriptionTemplateSummaryResponse delete(Long id) {
        PrescriptionTemplate template = prescriptionTemplateRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("PrescriptionTemplate no encontrado: id=" + id));

        PrescriptionTemplateSummaryResponse summary = PrescriptionTemplateMapper.toSummary(template);
        prescriptionTemplateRepository.delete(template);
        return summary;
    }

    private void overwriteMedications(PrescriptionTemplate template, List<PrescriptionTemplateMedicationRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException("Debe registrar al menos un medicamento en la plantilla.");
        }

        Map<Long, Product> productsById = fetchProducts(requests);

        List<PrescriptionTemplateMedication> targetList = template.getMedications();
        if (targetList == null) {
            targetList = new ArrayList<>();
            template.setMedications(targetList);
        }

        targetList.clear();

        for (PrescriptionTemplateMedicationRequest request : requests) {
            Product product = null;
            if (request.getProductId() != null) {
                product = productsById.get(request.getProductId());
                if (product == null) {
                    throw new IllegalArgumentException("Producto no encontrado: id=" + request.getProductId());
                }
                if (request.getDosageUnit() == null) {
                    throw new IllegalArgumentException("La unidad de dosificación es obligatoria para el producto: id=" + request.getProductId());
                }
            }

            String customName = normalizeNullable(request.getCustomMedicationName());
            if (product == null && customName == null) {
                throw new IllegalArgumentException("Se requiere un producto de inventario o un nombre personalizado para cada medicamento.");
            }

            PrescriptionTemplateMedication medication = PrescriptionTemplateMedication.builder()
                    .prescriptionTemplate(template)
                    .product(product)
                    .customMedicationName(customName)
                    .dosageAmount(request.getDosageAmount())
                    .dosageUnit(request.getDosageUnit())
                    .frequencyValue(request.getFrequencyValue())
                    .frequencyUnit(request.getFrequencyUnit())
                    .durationValue(request.getDurationValue())
                    .durationUnit(request.getDurationUnit())
                    .instructions(normalizeNullable(request.getInstructions()))
                    .build();

            targetList.add(medication);
        }
    }

    private Map<Long, Product> fetchProducts(List<PrescriptionTemplateMedicationRequest> requests) {
        Set<Long> ids = requests.stream()
                .map(PrescriptionTemplateMedicationRequest::getProductId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Product> products = productRepository.findAllById(ids);
        Map<Long, Product> productsById = products.stream()
                .collect(Collectors.toMap(Product::getId, product -> product));

        Set<Long> missing = new HashSet<>(ids);
        missing.removeAll(productsById.keySet());
        if (!missing.isEmpty()) {
            throw new IllegalArgumentException("Productos no encontrados: " + missing);
        }

        return productsById;
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
