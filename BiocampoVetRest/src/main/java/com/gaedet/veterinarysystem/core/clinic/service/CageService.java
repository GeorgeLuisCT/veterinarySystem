package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.branches.repository.BranchRepository;
import com.gaedet.veterinarysystem.core.clinic.entity.Cage;
import com.gaedet.veterinarysystem.core.clinic.entity.Hospitalization;
import com.gaedet.veterinarysystem.core.clinic.enums.CageSize;
import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationStatus;
import com.gaedet.veterinarysystem.core.clinic.mapper.CageMapper;
import com.gaedet.veterinarysystem.core.clinic.repository.CageRepository;
import com.gaedet.veterinarysystem.core.clinic.dto.CageRequest;
import com.gaedet.veterinarysystem.core.clinic.dto.CageResponse;
import com.gaedet.veterinarysystem.core.clinic.repository.HospitalizationRepository;
import com.gaedet.veterinarysystem.core.clinic.specs.CageSpecification;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CageService {

    private final CageRepository cageRepository;
    private final BranchRepository branchRepository;
    private final HospitalizationRepository hospitalizationRepository;

    private static final List<HospitalizationStatus> ACTIVE_STATUSES = Arrays.asList(
            HospitalizationStatus.ADMITTED,
            HospitalizationStatus.IN_TREATMENT,
            HospitalizationStatus.STABLE,
            HospitalizationStatus.OBSERVATION,
            HospitalizationStatus.CRITICAL
    );

    @Transactional(readOnly = true)
    public PaginatedResponse<CageResponse> list(
            Long branchId, String name, CageSize size, Boolean isOccupied, int page, int pageSize) {

        Specification<Cage> spec = CageSpecification.byFilters(branchId, name, size, isOccupied);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("name").ascending());

        Page<Cage> cagePage = cageRepository.findAll(spec, pageable);

        List<CageResponse> cageResponses = cagePage.getContent().stream()
                .map(cage -> {
                    Hospitalization current = null;
                    if (cage.isOccupied()) {
                        List<Hospitalization> list = hospitalizationRepository
                                .findActiveByCageIdOrderByAdmissionDesc(cage.getId(), ACTIVE_STATUSES);
                        if (!list.isEmpty()) current = list.get(0);
                    }
                    return CageMapper.toResponse(cage, current);
                })
                .collect(Collectors.toList());

        return new PaginatedResponse<>(
                cageResponses,
                cagePage.getTotalPages(),
                cagePage.getTotalElements(),
                cagePage.getNumber(),
                cagePage.getSize()
        );
    }

    @Transactional(readOnly = true)
    public CageResponse findById(Long id) {
        Cage cage = cageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cage not found with id: " + id));

        Hospitalization current = null;
        if (Boolean.TRUE.equals(cage.isOccupied())) {
            List<Hospitalization> list = hospitalizationRepository
                    .findActiveByCageIdOrderByAdmissionDesc(cage.getId(), ACTIVE_STATUSES);
            if (!list.isEmpty()) current = list.get(0);
        }

        return CageMapper.toResponse(cage, current);
    }

    @Transactional
    public CageResponse create(CageRequest request) {
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found with id: " + request.getBranchId()));
        Cage cage = CageMapper.toEntity(request, branch);
        cage = cageRepository.save(cage);
        return CageMapper.toResponse(cage, null);
    }

    @Transactional
    public CageResponse update(Long id, CageRequest request) {
        Cage cage = cageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cage not found with id: " + id));
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new EntityNotFoundException("Branch not found with id: " + request.getBranchId()));

        cage.setName(request.getName());
        cage.setSize(request.getSize());
        cage.setBranch(branch);

        cage = cageRepository.save(cage);

        Hospitalization current = null;
        if (Boolean.TRUE.equals(cage.isOccupied())) {
            List<Hospitalization> list = hospitalizationRepository
                    .findActiveByCageIdOrderByAdmissionDesc(cage.getId(), ACTIVE_STATUSES);
            if (!list.isEmpty()) current = list.get(0);
        }
        return CageMapper.toResponse(cage, current);
    }

    @Transactional
    public void delete(Long id) {
        Cage cage = cageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cage not found with id: " + id));

        if (cage.isOccupied()) {
            throw new IllegalStateException("Cannot delete an occupied cage.");
        }
        cageRepository.deleteById(id);
    }
}
