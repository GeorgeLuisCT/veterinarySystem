package com.gaedet.veterinarysystem.core.fieltd.service;

import com.gaedet.veterinarysystem.core.fieltd.dto.*;
import com.gaedet.veterinarysystem.core.fieltd.entity.GeoZone;
import com.gaedet.veterinarysystem.core.fieltd.enums.GeoZoneType;
import com.gaedet.veterinarysystem.core.fieltd.mapper.GeoZoneMapper;
import com.gaedet.veterinarysystem.core.fieltd.repository.GeoZoneRepository;
import com.gaedet.veterinarysystem.core.fieltd.specs.GeoZoneSpecs;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
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
public class GeoZoneService {

    private final GeoZoneRepository geoZoneRepository;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public PaginatedResponse<GeoZoneSummaryResponse> list(
            int page, int size, String q, GeoZoneType type, Long parentId, Boolean active
    ) {
        Specification<GeoZone> spec = GeoZoneSpecs.byFilters(q, type, parentId, active);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("name").ascending());

        Page<GeoZone> result = geoZoneRepository.findAll(spec, pageable);
        List<GeoZoneSummaryResponse> summaries = result.getContent().stream()
                .map(GeoZoneMapper::toSummary)
                .collect(Collectors.toList());

        return PaginatedResponse.<GeoZoneSummaryResponse>builder()
                .content(summaries)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public GeoZoneResponse getById(Long id) {
        GeoZone e = geoZoneRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("GeoZone no encontrado: id=" + id));
        return GeoZoneMapper.toResponse(e);
    }

    @Transactional
    public GeoZoneResponse create(CreateGeoZoneRequest r) {
        // Validar unicidad por (name, parent)
        Long parentId = r.getParentId();
        if (parentId == null || parentId == 0) {
            if (geoZoneRepository.existsByNameIgnoreCaseAndParentIsNull(r.getName().trim())) {
                throw new IllegalArgumentException("Ya existe una GeoZone con ese nombre en el nivel raíz.");
            }
        } else {
            if (geoZoneRepository.existsByNameIgnoreCaseAndParent_Id(r.getName().trim(), parentId)) {
                throw new IllegalArgumentException("Ya existe una GeoZone con ese nombre bajo el padre indicado.");
            }
        }

        GeoZone e = new GeoZone();
        GeoZoneMapper.applyCreate(e, r);

        if (parentId != null && parentId > 0) {
            e.setParent(entityManager.getReference(GeoZone.class, parentId));
        } else {
            e.setParent(null);
        }

        GeoZone saved = geoZoneRepository.save(e);
        return GeoZoneMapper.toResponse(saved);
    }

    @Transactional
    public GeoZoneResponse update(Long id, UpdateGeoZoneRequest r) {
        GeoZone e = geoZoneRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("GeoZone no encontrado: id=" + id));

        Long parentId = r.getParentId();
        String newName = r.getName().trim();
        if (parentId == null || parentId == 0) {
            if (!e.getName().equalsIgnoreCase(newName)
                    || (e.getParent() != null)) {
                if (geoZoneRepository.existsByNameIgnoreCaseAndParentIsNullAndIdNot(newName, id)) {
                    throw new IllegalArgumentException("Ya existe una GeoZone con ese nombre en el nivel raíz.");
                }
            }
        } else {
            Long currentParentId = e.getParent() == null ? 0L : e.getParent().getId();
            if (!e.getName().equalsIgnoreCase(newName) || !parentId.equals(currentParentId)) {
                if (geoZoneRepository.existsByNameIgnoreCaseAndParent_IdAndIdNot(newName, parentId, id)) {
                    throw new IllegalArgumentException("Ya existe una GeoZone con ese nombre bajo el padre indicado.");
                }
            }
        }

        GeoZoneMapper.applyUpdate(e, r);
        if (parentId != null && parentId > 0) {
            e.setParent(entityManager.getReference(GeoZone.class, parentId));
        } else {
            e.setParent(null);
        }
        return GeoZoneMapper.toResponse(e);
    }

    @Transactional
    public GeoZoneSummaryResponse delete(Long id) {
        GeoZone e = geoZoneRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("GeoZone no encontrado: id=" + id));
        GeoZoneSummaryResponse summary = GeoZoneMapper.toSummary(e);
        geoZoneRepository.delete(e);
        return summary;
    }
}

