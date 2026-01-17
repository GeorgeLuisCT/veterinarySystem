package com.gaedet.veterinarysystem.core.fieltd.service;

import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.fieltd.dto.*;
import com.gaedet.veterinarysystem.core.fieltd.entity.FieldTask;
import com.gaedet.veterinarysystem.core.fieltd.entity.FieldVisit;
import com.gaedet.veterinarysystem.core.fieltd.entity.Farm;
import com.gaedet.veterinarysystem.core.fieltd.entity.GeoZone;
import com.gaedet.veterinarysystem.core.fieltd.enums.FieldTaskStatus;
import com.gaedet.veterinarysystem.core.fieltd.mapper.FieldTaskMapper;
import com.gaedet.veterinarysystem.core.fieltd.mapper.FieldVisitMapper;
import com.gaedet.veterinarysystem.core.fieltd.repository.FieldTaskRepository;
import com.gaedet.veterinarysystem.core.fieltd.repository.FieldVisitRepository;
import com.gaedet.veterinarysystem.core.fieltd.repository.FarmRepository;
import com.gaedet.veterinarysystem.core.fieltd.specs.FieldTaskSpecs;
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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FieldTaskService {
    private final FieldTaskRepository fieldTaskRepository;
    private final FarmRepository farmRepository;
    private final FieldVisitService fieldVisitService;
    private final FieldVisitRepository fieldVisitRepository;
    private final EntityManager em;

    @Transactional(readOnly = true)
    public PaginatedResponse<FieldTaskSummaryResponse> list(int page, int size, String q,
                                                            com.gaedet.veterinarysystem.core.fieltd.enums.FieldTaskStatus status,
                                                            com.gaedet.veterinarysystem.core.fieltd.enums.FieldTaskPriority priority,
                                                            Long assignedToId, Long farmId, Long zoneId,
                                                            java.time.LocalDateTime dueFrom, java.time.LocalDateTime dueTo) {
        Specification<FieldTask> spec = FieldTaskSpecs.byFilters(q, status, priority, assignedToId, farmId, zoneId, dueFrom, dueTo);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by("createdAt").descending());
        Page<FieldTask> result = fieldTaskRepository.findAll(spec, pageable);
        List<FieldTaskSummaryResponse> content = result.getContent().stream().map(FieldTaskMapper::toSummary).collect(Collectors.toList());
        return PaginatedResponse.<FieldTaskSummaryResponse>builder()
                .content(content)
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public FieldTaskResponse get(Long id) {
        FieldTask e = fieldTaskRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Tarea no encontrada"));
        return FieldTaskMapper.toResponse(e);
    }

    @Transactional
    public List<FieldTaskResponse> create(CreateFieldTaskRequest r, Long createdById) {
        if (r.getFarmIds() == null || r.getFarmIds().isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar al menos una finca para la planificación.");
        }
        GeoZone zone = r.getZoneId() != null ? em.getReference(GeoZone.class, r.getZoneId()) : null;
        List<FieldTask> tasks = new ArrayList<>();
        for (Long farmId : r.getFarmIds()) {
            Farm farm = farmRepository.findById(farmId)
                    .orElseThrow(() -> new IllegalArgumentException("Finca no encontrada: id=" + farmId));
            FieldTask e = new FieldTask();
            e.setTitle(r.getTitle().trim());
            e.setFarm(farm);
            e.setZone(zone != null ? zone : farm.getZone());
            e.setDescription(r.getDescription());
            e.setPriority(r.getPriority());
            e.setStatus(r.getStatus() != null ? r.getStatus() : FieldTaskStatus.PENDING);
            e.setAssignedTo(null);
            e.setDueAt(r.getDueAt());
            e.setCreatedBy(createdById != null ? em.getReference(Employee.class, createdById) : null);
            tasks.add(e);
        }
        fieldTaskRepository.saveAll(tasks);
        return tasks.stream().map(FieldTaskMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public FieldTaskResponse update(Long id, UpdateFieldTaskRequest r) {
        FieldTask e = fieldTaskRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Tarea no encontrada"));
        e.setTitle(r.getTitle().trim());
        Farm farm = farmRepository.findById(r.getFarmId())
                .orElseThrow(() -> new IllegalArgumentException("Finca no encontrada: id=" + r.getFarmId()));
        e.setFarm(farm);
        if (r.getZoneId() != null) {
            e.setZone(em.getReference(GeoZone.class, r.getZoneId()));
        } else if (farm.getZone() != null) {
            e.setZone(farm.getZone());
        }
        e.setDescription(r.getDescription());
        e.setPriority(r.getPriority());
        e.setStatus(r.getStatus());
        e.setDueAt(r.getDueAt());
        return FieldTaskMapper.toResponse(e);
    }

    @Transactional
    public FieldTaskSummaryResponse delete(Long id) {
        FieldTask e = fieldTaskRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Tarea no encontrada"));
        FieldTaskSummaryResponse out = FieldTaskMapper.toSummary(e);
        fieldTaskRepository.delete(e);
        return out;
    }

    @Transactional
    public FieldVisitSummaryResponse assign(Long taskId, AssignFieldTaskRequest request, Long assignedById) {
        FieldTask task = fieldTaskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Tarea no encontrada"));
        if (task.getCreatedFieldVisit() != null) {
            throw new IllegalStateException("La tarea ya tiene una visita asignada.");
        }

        CreateFieldVisitRequest visitRequest = CreateFieldVisitRequest.builder()
                .farmId(task.getFarm().getId())
                .zoneId(task.getZone() != null ? task.getZone().getId() : (task.getFarm().getZone() != null ? task.getFarm().getZone().getId() : null))
                .fieldVetId(request.getFieldVetId())
                .vehicleId(request.getVehicleId())
                .scheduledDateTime(request.getScheduledDateTime())
                .objective(request.getObjective())
                .companionIds(request.getCompanionIds() != null ? request.getCompanionIds() : List.of())
                .build();

        FieldVisitResponse visitResponse = fieldVisitService.create(visitRequest);
        FieldVisit visitEntity = fieldVisitRepository.findById(visitResponse.getId())
                .orElseThrow(() -> new IllegalStateException("No se pudo recuperar la visita generada"));

        task.setAssignedTo(em.getReference(Employee.class, request.getFieldVetId()));
        task.setStatus(FieldTaskStatus.ASSIGNED);
        task.setDueAt(request.getScheduledDateTime());
        task.setCreatedFieldVisit(visitEntity);
        if (task.getZone() == null && visitEntity.getFarm() != null && visitEntity.getFarm().getZone() != null) {
            task.setZone(visitEntity.getFarm().getZone());
        }

        fieldTaskRepository.save(task);

        return FieldVisitMapper.toSummary(visitEntity);
    }
}
