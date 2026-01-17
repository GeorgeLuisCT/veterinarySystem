package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.branches.entity.Laboratory;
import com.gaedet.veterinarysystem.core.branches.repository.LaboratoryRepository;
import com.gaedet.veterinarysystem.core.clinic.dto.*;
import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryTest;
import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryTestLaboratory;
import com.gaedet.veterinarysystem.core.clinic.mapper.LaboratoryTestMapper;
import com.gaedet.veterinarysystem.core.clinic.repository.LaboratoryTestLaboratoryRepository;
import com.gaedet.veterinarysystem.core.clinic.repository.LaboratoryTestRepository;
import com.gaedet.veterinarysystem.core.clinic.specs.LaboratoryTestSpecs;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LaboratoryTestService {

    private final LaboratoryTestRepository laboratoryTestRepository;
    private final LaboratoryRepository laboratoryRepository;
    private final LaboratoryTestLaboratoryRepository laboratoryTestLaboratoryRepository;

    @Transactional(readOnly = true)
    public PaginatedResponse<LaboratoryTestSummaryResponse> list(
            int page, int size, String q, Long laboratoryId) {
        Specification<LaboratoryTest> spec = LaboratoryTestSpecs.byFilters(q, laboratoryId);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("name").ascending());

        Page<LaboratoryTest> result = laboratoryTestRepository.findAll(spec, pageable);

        List<LaboratoryTestSummaryResponse> summaries = result.getContent().stream()
                .map(LaboratoryTestMapper::toSummary)
                .collect(Collectors.toList());

        return PaginatedResponse.<LaboratoryTestSummaryResponse>builder()
                .content(summaries)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public LaboratoryTestResponse getById(Long id) {
        LaboratoryTest e = laboratoryTestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("LaboratoryTest no encontrado: id=" + id));
        return LaboratoryTestMapper.toResponse(e);
    }

    @Transactional
    public LaboratoryTestResponse create(CreateLaboratoryTestRequest r) {
        if (laboratoryTestRepository.existsByCodeIgnoreCase(r.getCode())) {
            throw new IllegalArgumentException("Ya existe una prueba de laboratorio con ese código.");
        }

        LaboratoryTest e = new LaboratoryTest();
        LaboratoryTestMapper.applyCreate(e, r);
        syncLaboratoryLinks(e, r.getLaboratories());

        LaboratoryTest saved = laboratoryTestRepository.save(e);
        return LaboratoryTestMapper.toResponse(saved);
    }

    @Transactional
    public LaboratoryTestResponse update(Long id, UpdateLaboratoryTestRequest r) {
        LaboratoryTest e = laboratoryTestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("LaboratoryTest no encontrado: id=" + id));

        String newCode = r.getCode().trim();
        if (!e.getCode().equalsIgnoreCase(newCode) && laboratoryTestRepository.existsByCodeIgnoreCase(newCode)) {
            throw new IllegalArgumentException("Ya existe una prueba de laboratorio con ese código.");
        }

        LaboratoryTestMapper.applyUpdate(e, r);

        if (r.getLaboratories() != null) {
            syncLaboratoryLinks(e, r.getLaboratories());
        }

        return LaboratoryTestMapper.toResponse(e);
    }

    @Transactional
    public LaboratoryTestSummaryResponse delete(Long id) {
        LaboratoryTest e = laboratoryTestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("LaboratoryTest no encontrado: id=" + id));

        LaboratoryTestSummaryResponse summary = LaboratoryTestMapper.toSummary(e);

        laboratoryTestRepository.delete(e);
        return summary;
    }

    @Transactional
    public LaboratoryTestSummaryResponse setLaboratoryActivation(Long testId, Long laboratoryId, boolean active) {
        LaboratoryTest test = laboratoryTestRepository.findById(testId)
                .orElseThrow(() -> new IllegalArgumentException("LaboratoryTest no encontrado: id=" + testId));

        Optional<LaboratoryTestLaboratory> optionalLink =
                laboratoryTestLaboratoryRepository.findByLaboratoryIdAndLaboratoryTestId(laboratoryId, testId);

        LaboratoryTestLaboratory link = optionalLink.orElseGet(() ->
                LaboratoryTestLaboratory.builder()
                        .laboratory(Laboratory.builder().id(laboratoryId).build())
                        .laboratoryTest(test)
                        .isActive(true)
                        .build()
        );

        link.setActive(active);

        if (link.getLaboratoryTest() == null) {
            link.setLaboratoryTest(test);
        }
        if (link.getLaboratory() == null) {
            link.setLaboratory(Laboratory.builder().id(laboratoryId).build());
        }

        test.getLaboratoryLinks().add(link);
        laboratoryTestLaboratoryRepository.save(link);

        return LaboratoryTestMapper.toSummary(test);
    }

    private void syncLaboratoryLinks(LaboratoryTest test, List<LaboratoryActivationInput> laboratoryInputs) {
        Map<Long, Boolean> requestedStates = laboratoryInputs == null
                ? Map.of()
                : laboratoryInputs.stream()
                .collect(Collectors.toMap(
                        LaboratoryActivationInput::getLaboratoryId,
                        bi -> Boolean.TRUE.equals(bi.getActive()),
                        (existing, replacement) -> replacement
                ));

        List<Laboratory> allLaboratories = laboratoryRepository.findAll();
        Set<Long> existingLaboratoryIds = allLaboratories.stream()
                .map(Laboratory::getId)
                .collect(Collectors.toSet());

        Set<Long> unknownLaboratoryIds = new HashSet<>(requestedStates.keySet());
        unknownLaboratoryIds.removeAll(existingLaboratoryIds);
        if (!unknownLaboratoryIds.isEmpty()) {
            throw new IllegalArgumentException("Laboratorios no existen: " + unknownLaboratoryIds);
        }

        if (test.getLaboratoryLinks() == null) {
            test.setLaboratoryLinks(new HashSet<>());
        }

        Map<Long, LaboratoryTestLaboratory> currentLinks = test.getLaboratoryLinks().stream()
                .collect(Collectors.toMap(
                        link -> link.getLaboratory().getId(),
                        link -> link
                ));

        for (Laboratory laboratory : allLaboratories) {
            boolean active = requestedStates.getOrDefault(laboratory.getId(), false);
            LaboratoryTestLaboratory link = currentLinks.get(laboratory.getId());
            if (link == null) {
                link = LaboratoryTestLaboratory.builder()
                        .laboratory(laboratory)
                        .laboratoryTest(test)
                        .isActive(active)
                        .build();
                test.getLaboratoryLinks().add(link);
            } else {
                link.setActive(active);
            }
        }

                test.getLaboratoryLinks().removeIf(link -> !existingLaboratoryIds.contains(link.getLaboratory().getId()));

            }

        

            @Transactional(readOnly = true)

            public List<LaboratoryTestQuickSearchResponse> quickSearch(String name, Long laboratoryId) {

                String searchQuery = (name == null || name.isBlank()) ? null : name.trim();

                Long formattedLaboratoryId = (laboratoryId == null || laboratoryId == 0) ? null : laboratoryId;

        

                List<Object[]> rawResults = laboratoryTestRepository.quickLaboratoryTestSearch(

                        searchQuery,

                        formattedLaboratoryId,

                        Boolean.TRUE

                );

        

                return rawResults.stream()

                        .map(LaboratoryTestQuickSearchResponse::fromNativeRow)

                        .collect(Collectors.toList());

            }

        }

        