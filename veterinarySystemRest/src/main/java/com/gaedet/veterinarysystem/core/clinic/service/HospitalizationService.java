package com.gaedet.veterinarysystem.core.clinic.service;

import com.gaedet.veterinarysystem.core.animal.entity.Animal;
import com.gaedet.veterinarysystem.core.animal.repository.AnimalRepository;
import com.gaedet.veterinarysystem.core.clinic.dto.*;
import com.gaedet.veterinarysystem.core.clinic.entity.*;
import com.gaedet.veterinarysystem.core.clinic.enums.AdmissionTiming;
import com.gaedet.veterinarysystem.core.clinic.enums.FrequencyUnit;
import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationStatus;
import com.gaedet.veterinarysystem.core.clinic.mapper.CageMapper;
import com.gaedet.veterinarysystem.core.clinic.mapper.HospitalizationMapper;
import com.gaedet.veterinarysystem.core.clinic.repository.*;
import com.gaedet.veterinarysystem.core.clinic.specs.HospitalizationSpecification;
import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.repository.EmployeeRepository;
import com.gaedet.veterinarysystem.core.global.PaginatedResponse;
import com.gaedet.veterinarysystem.core.inventory.dto.KardexRegistrationRequest;
import com.gaedet.veterinarysystem.core.inventory.enums.KardexMovementType;
import com.gaedet.veterinarysystem.core.inventory.entity.Product;
import com.gaedet.veterinarysystem.core.inventory.repository.ProductRepository;
import com.gaedet.veterinarysystem.core.inventory.service.KardexService;
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
import com.gaedet.veterinarysystem.exeption.BadRequestException;

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
    private final com.gaedet.veterinarysystem.core.inventory.service.InventoryConsumptionService inventoryConsumptionService;
    private final ProductRepository productRepository;
    private final HospitalizationVitalSignRepository hospitalizationVitalSignRepository;

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
        Cage cage = cageRepository.findByIdForUpdate(request.getCageId())
                .orElseThrow(() -> new EntityNotFoundException("Cage not found with id: " + request.getCageId()));

        if (cage.isOccupied()) {
            throw new IllegalStateException("La jaula ya está ocupada.");
        }

        if (hospitalizationRepository.existsByAnimalIdAndStatusNotIn(animal.getId(), FINAL_STATUSES)) {
            throw new IllegalStateException("El paciente ya tiene una hospitalización vigente.");
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

        assertActive(hospitalization);

        if (request.getDischargeDate() != null) {
            hospitalization.setDischargeDate(request.getDischargeDate());
            updatedFields.put("dischargeDate", request.getDischargeDate());
            // Indicar fecha de alta equivale a dar el alta
            if (request.getStatus() == null) {
                request.setStatus(HospitalizationStatus.DISCHARGED);
            }
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

        // Alta o cancelación: se registra la fecha de salida y se LIBERA la jaula para nuevos ingresos
        if (FINAL_STATUSES.contains(hospitalization.getStatus())) {
            if (hospitalization.getDischargeDate() == null) {
                hospitalization.setDischargeDate(LocalDateTime.now());
                updatedFields.put("dischargeDate", hospitalization.getDischargeDate());
            }
            Cage cage = hospitalization.getCage();
            if (cage != null && cage.isOccupied()) {
                cage.setOccupied(false);
                cageRepository.save(cage);
            }
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
        assertActive(hospitalization);
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

        assertActive(hospitalization);

        TreatmentSchedule schedule = treatmentScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new EntityNotFoundException("TreatmentSchedule not found with id: " + scheduleId));

        if (!schedule.getHospitalization().getId().equals(hospitalizationId)) {
            throw new IllegalArgumentException("Treatment schedule does not belong to the specified hospitalization.");
        }

        // Si el tratamiento ya estaba administrado, primero se devuelve lo consumido: así marcar/desmarcar
        // o re-guardar no duplica ni pierde stock.
        if (schedule.isCompleted()) {
            inventoryConsumptionService.restore("TreatmentSchedule", schedule.getId());
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
            } else {
                schedule.setCompletedBy(null);
            }

            Long branchId = hospitalization.getCage() != null && hospitalization.getCage().getBranch() != null
                    ? hospitalization.getCage().getBranch().getId()
                    : null;

            schedule.getProductUsages().clear();
            if (request.getProducts() != null) {
                for (TreatmentScheduleProductUsageRequest productRequest : request.getProducts()) {
                    Product product = productRepository.findById(productRequest.getProductId())
                            .orElseThrow(() -> new EntityNotFoundException(
                                    "Product not found with id: " + productRequest.getProductId()));
                    TreatmentScheduleProductUsage usage = TreatmentScheduleProductUsage.builder()
                            .treatmentSchedule(schedule)
                            .product(product)
                            .quantity(productRequest.getQuantity())
                            .unit(productRequest.getUnit())
                            .build();
                    schedule.getProductUsages().add(usage);

                    if (branchId == null) {
                        throw new BadRequestException("La hospitalización no tiene jaula/sucursal para descontar inventario");
                    }
                    // Descuento FEFO por lotes; falla de forma explícita si no hay stock suficiente
                    inventoryConsumptionService.consume(productRequest.getProductId(), branchId,
                            productRequest.getQuantity(), productRequest.getUnit(),
                            "TreatmentSchedule", schedule.getId());
                }
            }
        } else {
            schedule.setCompletedAt(null);
            schedule.setCompletedBy(null);
            schedule.getProductUsages().clear();
        }

        treatmentScheduleRepository.save(schedule);

        Hospitalization updated = hospitalizationRepository.findById(hospitalizationId).orElseThrow();
        return HospitalizationMapper.toResponse(updated);
    }

    @Transactional
    public HospitalizationResponse addVitalSign(Long hospitalizationId, CreateHospitalizationVitalSignRequest request) {
        Hospitalization hospitalization = hospitalizationRepository.findById(hospitalizationId)
                .orElseThrow(
                        () -> new EntityNotFoundException("Hospitalization not found with id: " + hospitalizationId));
        assertActive(hospitalization);

        if (request == null || !request.hasAnyMeasurement()) {
            throw new IllegalArgumentException("Debe registrar al menos una constante vital.");
        }

        Employee recordedBy = employeeRepository.findById(request.getRecordedByEmployeeId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Employee not found with id: " + request.getRecordedByEmployeeId()));

        LocalDateTime recordedAt = request.getRecordedAt() != null ? request.getRecordedAt() : LocalDateTime.now();

        HospitalizationVitalSign vitalSign = HospitalizationVitalSign.builder()
                .hospitalization(hospitalization)
                .recordedBy(recordedBy)
                .recordedAt(recordedAt)
                .weightKg(request.getWeightKg())
                .temperatureCelsius(request.getTemperatureCelsius())
                .heartRate(request.getHeartRate())
                .respiratoryRate(request.getRespiratoryRate())
                .build();

        hospitalizationVitalSignRepository.save(vitalSign);

        Hospitalization updated = hospitalizationRepository.findById(hospitalizationId).orElseThrow();
        return HospitalizationMapper.toResponse(updated);
    }

    @Transactional
    public HospitalizationResponse addTreatmentSchedule(Long hospitalizationId,
            CreateTreatmentScheduleRequest request) {
        Hospitalization hospitalization = hospitalizationRepository.findById(hospitalizationId)
                .orElseThrow(
                        () -> new EntityNotFoundException("Hospitalization not found with id: " + hospitalizationId));
        assertActive(hospitalization);

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
                scheduledTime = incrementScheduledTime(scheduledTime, request.getFrequencyValue(),
                        request.getFrequencyUnit());
            }
        }

        Hospitalization updated = hospitalizationRepository.findById(hospitalizationId).orElseThrow();
        return HospitalizationMapper.toResponse(updated);
    }

    private LocalDateTime incrementScheduledTime(LocalDateTime base, Integer frequencyValue, FrequencyUnit unit) {
        if (frequencyValue == null || unit == null) {
            return base;
        }
        switch (unit) {
            case MINUTES:
                return base.plusMinutes(frequencyValue);
            case HOURS:
                return base.plusHours(frequencyValue);
            case DAYS:
                return base.plusDays(frequencyValue);
            default:
                return base;
        }
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

    private static final java.util.Set<HospitalizationStatus> FINAL_STATUSES =
            java.util.Set.of(HospitalizationStatus.DISCHARGED, HospitalizationStatus.CANCELLED);

    /** Una hospitalización con alta o cancelada es un registro histórico: no admite cambios ni nuevos cargos. */
    private void assertActive(Hospitalization hospitalization) {
        if (FINAL_STATUSES.contains(hospitalization.getStatus())) {
            throw new IllegalStateException("La hospitalización ya fue "
                    + (hospitalization.getStatus() == HospitalizationStatus.DISCHARGED ? "dada de alta" : "cancelada")
                    + " y no admite cambios");
        }
    }
}
