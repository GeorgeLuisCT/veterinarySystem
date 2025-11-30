package com.gaedet.biocampovet.core.clinic.service;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.repository.AnimalRepository;
import com.gaedet.biocampovet.core.clinic.dto.*;
import com.gaedet.biocampovet.core.clinic.entity.*;
import com.gaedet.biocampovet.core.clinic.enums.AdmissionTiming;
import com.gaedet.biocampovet.core.clinic.enums.HospitalizationStatus;
import com.gaedet.biocampovet.core.clinic.mapper.CageMapper;
import com.gaedet.biocampovet.core.clinic.mapper.HospitalizationMapper;
import com.gaedet.biocampovet.core.clinic.repository.*;
import com.gaedet.biocampovet.core.clinic.specs.HospitalizationSpecification;
import com.gaedet.biocampovet.core.employees.entity.Employee;
import com.gaedet.biocampovet.core.employees.repository.EmployeeRepository;
import com.gaedet.biocampovet.core.employees.repository.EmployeeRepository;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import com.gaedet.biocampovet.core.inventory.dto.KardexRegistrationRequest;
import com.gaedet.biocampovet.core.inventory.enums.KardexMovementType;
import com.gaedet.biocampovet.core.inventory.service.KardexService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HospitalizationService {

    private final HospitalizationRepository hospitalizationRepository;
    private final AnimalRepository animalRepository;
    private final CageRepository cageRepository;
    private final EmployeeRepository employeeRepository;
    private final EvolutionNoteRepository evolutionNoteRepository;
    private final TreatmentScheduleRepository treatmentScheduleRepository;
    private final AttentionRepository attentionsRepository;
    private final ClinicalServiceRepository clinicalServiceRepository;
    private final KardexService kardexService;

    @Transactional(readOnly = true)
    public PaginatedResponse<HospitalizationSummaryResponse> list(
            Long branchId,
            Long animalId,
            Long cageId,
            List<HospitalizationStatus> statuses,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int pageSize) {

        Specification<Hospitalization> spec = HospitalizationSpecification.byFilters(
                branchId, animalId, cageId, statuses, startDate, endDate);

        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("admissionDate").descending());

        Page<Hospitalization> hospitalizationPage = hospitalizationRepository.findAll(spec, pageable);

        List<HospitalizationSummaryResponse> summaryResponses = hospitalizationPage.getContent().stream()
                .map(HospitalizationMapper::toSummaryResponse)
                .collect(Collectors.toList());

        return new PaginatedResponse<>(
                summaryResponses,
                hospitalizationPage.getTotalPages(),
                hospitalizationPage.getTotalElements(),
                hospitalizationPage.getNumber(),
                hospitalizationPage.getSize());
    }

    @Transactional(readOnly = true)
    public HospitalizationResponse getHospitalizationById(Long id) {
        Hospitalization hospitalization = hospitalizationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hospitalization not found with id: " + id));
        return HospitalizationMapper.toResponse(hospitalization);
    }

    @Transactional
    public CageResponse createHospitalization(CreateHospitalizationRequest request) {
        Animal animal = animalRepository.findById(request.getAnimalId())
                .orElseThrow(() -> new EntityNotFoundException("Animal not found with id: " + request.getAnimalId()));
        Cage cage = cageRepository.findById(request.getCageId())
                .orElseThrow(() -> new EntityNotFoundException("Cage not found with id: " + request.getCageId()));

        if (cage.isOccupied()) {
            throw new IllegalStateException("Cage is already occupied.");
        }

        Attentions attention = null;
        if (request.getAttentionId() != null) {
            attention = attentionsRepository.findById(request.getAttentionId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Attention not found with id: " + request.getAttentionId()));
            if (!Objects.equals(animal.getId(), attention.getAnimal().getId())) {
                throw new IllegalArgumentException("Attention animal does not match hospitalization animal.");
            }
            if (attention.getBranch() != null && cage.getBranch() != null &&
                    !Objects.equals(attention.getBranch().getId(), cage.getBranch().getId())) {
                throw new IllegalArgumentException("Cage branch must match attention branch.");
            }
        }

        AdmissionTiming timing = getAdmissionTiming(request, attention);

        ClinicalService clinicalService = null;
        if (request.getClinicalServiceId() != null) {
            clinicalService = clinicalServiceRepository.findById(request.getClinicalServiceId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "ClinicalService not found with id: " + request.getClinicalServiceId()));
        }

        Hospitalization hospitalization = Hospitalization.builder()
                .animal(animal)
                .cage(cage)
                .attention(attention)
                .admissionTiming(timing)
                .cause(request.getCause())
                .clinicalService(clinicalService)
                .admissionDate(LocalDateTime.now())
                .admissionNotes(request.getAdmissionNotes())
                .status(HospitalizationStatus.ADMITTED)
                .build();

        cage.setOccupied(true);
        cageRepository.save(cage);

        hospitalization = hospitalizationRepository.save(hospitalization);

        return CageMapper.toResponse(cage, hospitalization);
    }

    @Transactional
    public HospitalizationPatchResponse patchHospitalization(Long id, UpdateHospitalizationRequest request) {
        Hospitalization hospitalization = hospitalizationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hospitalization not found with id: " + id));

        if (!Objects.equals(request.getVersion(), hospitalization.getVersion())) {
            throw new org.springframework.orm.ObjectOptimisticLockingFailureException(Hospitalization.class,
                    hospitalization.getId());
        }

        Map<String, Object> updatedFields = new HashMap<>();

        if (request.getDischargeDate() != null) {
            hospitalization.setDischargeDate(request.getDischargeDate());
            updatedFields.put("dischargeDate", request.getDischargeDate());
        }
        if (request.getAdmissionNotes() != null) {
            hospitalization.setAdmissionNotes(request.getAdmissionNotes());
            updatedFields.put("admissionNotes", request.getAdmissionNotes());
        }
        if (request.getStatus() != null) {
            hospitalization.setStatus(request.getStatus());
            updatedFields.put("status", request.getStatus());
        }
        if (request.getCause() != null) {
            hospitalization.setCause(request.getCause());
            updatedFields.put("cause", request.getCause());
        }
        if (request.getClinicalServiceId() != null) {
            ClinicalService clinicalService = clinicalServiceRepository.findById(request.getClinicalServiceId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "ClinicalService not found with id: " + request.getClinicalServiceId()));
            hospitalization.setClinicalService(clinicalService);
            updatedFields.put("clinicalServiceId", clinicalService.getId());
        }

        Hospitalization saved = hospitalizationRepository.save(hospitalization);

        return new HospitalizationPatchResponse(
                saved.getId(),
                saved.getVersion(),
                saved.getStatus(),
                updatedFields);
    }

    @Transactional
    public HospitalizationResponse addEvolutionNote(Long hospitalizationId, AddEvolutionNoteRequest request) {
        Hospitalization hospitalization = hospitalizationRepository.findById(hospitalizationId)
                .orElseThrow(
                        () -> new EntityNotFoundException("Hospitalization not found with id: " + hospitalizationId));
        Employee author = employeeRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new EntityNotFoundException("Employee not found with id: " + request.getAuthorId()));

        EvolutionNote evolutionNote = new EvolutionNote();
        evolutionNote.setHospitalization(hospitalization);
        evolutionNote.setAuthor(author);
        evolutionNote.setNote(request.getNote());
        evolutionNote.setTimestamp(LocalDateTime.now());

        evolutionNoteRepository.save(evolutionNote);

        Hospitalization fresh = hospitalizationRepository.findById(hospitalizationId).orElseThrow();
        return HospitalizationMapper.toResponse(fresh);
    }

    @Transactional
    public HospitalizationResponse updateTreatmentSchedule(Long hospitalizationId, Long scheduleId,
            UpdateTreatmentScheduleRequest request) {
        Hospitalization hospitalization = hospitalizationRepository.findById(hospitalizationId)
                .orElseThrow(
                        () -> new EntityNotFoundException("Hospitalization not found with id: " + hospitalizationId));

        TreatmentSchedule schedule = treatmentScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("TreatmentSchedule not found with id: " + scheduleId));

        if (!schedule.getHospitalization().getId().equals(hospitalizationId)) {
            throw new IllegalArgumentException("Treatment schedule does not belong to the specified hospitalization.");
        }

        schedule.setCompleted(request.getIsCompleted());
        schedule.setNotes(request.getNotes());

        if (request.getIsCompleted()) {
            schedule.setCompletedAt(LocalDateTime.now());
            if (request.getCompletedByEmployeeId() != null) {
                Employee completedBy = employeeRepository.findById(request.getCompletedByEmployeeId())
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Employee not found with id: " + request.getCompletedByEmployeeId()));
                schedule.setCompletedBy(completedBy);
            }

            if (request.getProductId() != null && request.getQuantity() != null && request.getUnit() != null) {
                Long branchId = hospitalization.getCage().getBranch().getId();
                Map<Long, java.math.BigDecimal> batchStocks = kardexService
                        .getStockForProductByBatch(request.getProductId(), branchId);

                java.math.BigDecimal quantityToDeduct = request.getQuantity();

                // Simple FIFO strategy: take from first batch with stock
                for (Map.Entry<Long, java.math.BigDecimal> entry : batchStocks.entrySet()) {
                    if (entry.getValue().compareTo(java.math.BigDecimal.ZERO) > 0) {
                        // For simplicity, we just use the first batch found with stock.
                        // A more robust implementation would split across batches if needed.
                        Long batchId = entry.getKey();

                        kardexService.registerMovement(KardexRegistrationRequest.builder()
                                .productId(request.getProductId())
                                .branchId(branchId)
                                .batchId(batchId)
                                .quantity(quantityToDeduct)
                                .unitType(request.getUnit())
                                .type(KardexMovementType.SERVICE_EXIT)
                                .originId(schedule.getId())
                                .originType("TreatmentSchedule")
                                .build());
                        break; // Deducted from one batch and exit
                    }
                }
            }
        } else {
            schedule.setCompletedAt(null);
            schedule.setCompletedBy(null);
        }

        treatmentScheduleRepository.save(schedule);

        Hospitalization updated = hospitalizationRepository.findById(hospitalizationId).orElseThrow();
        return HospitalizationMapper.toResponse(updated);
    }

    @Transactional
    public HospitalizationResponse addTreatmentSchedule(Long hospitalizationId,
            CreateTreatmentScheduleRequest request) {
        Hospitalization hospitalization = hospitalizationRepository.findById(hospitalizationId)
                .orElseThrow(
                        () -> new EntityNotFoundException("Hospitalization not found with id: " + hospitalizationId));

        int doses = 1;
        if (request.getFrequencyValue() != null && request.getFrequencyUnit() != null) {
            doses = request.getNumberOfDoses() != null ? request.getNumberOfDoses() : 1;
        }

        LocalDateTime scheduledTime = request.getScheduledTime();

        for (int i = 0; i < doses; i++) {
            TreatmentSchedule schedule = TreatmentSchedule.builder()
                    .hospitalization(hospitalization)
                    .treatmentName(request.getTreatmentName())
                    .scheduledTime(scheduledTime)
                    .notes(request.getNotes())
                    .isCompleted(false)
                    .build();

            treatmentScheduleRepository.save(schedule);

            if (request.getFrequencyValue() != null && request.getFrequencyUnit() != null) {
                switch (request.getFrequencyUnit()) {
                    case HOURS:
                        scheduledTime = scheduledTime.plusHours(request.getFrequencyValue());
                        break;
                    case DAYS:
                        scheduledTime = scheduledTime.plusDays(request.getFrequencyValue());
                        break;
                    // Add other cases if FrequencyUnit has more values
                }
            }
        }

        Hospitalization updated = hospitalizationRepository.findById(hospitalizationId).orElseThrow();
        return HospitalizationMapper.toResponse(updated);
    }

    private static AdmissionTiming getAdmissionTiming(CreateHospitalizationRequest request, Attentions attention) {
        AdmissionTiming timing = request.getAdmissionTiming() != null
                ? request.getAdmissionTiming()
                : AdmissionTiming.NONE;

        if (timing != AdmissionTiming.NONE && attention == null) {
            throw new IllegalArgumentException("Admission timing requires an attention.");
        }
        if (timing == AdmissionTiming.NONE && attention != null) {
            throw new IllegalArgumentException("When admission timing is NONE, attention must be null.");
        }
        return timing;
    }
}
