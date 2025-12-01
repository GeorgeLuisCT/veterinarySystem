package com.gaedet.biocampovet.core.clinic.service;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.enums.AnimalSex;
import com.gaedet.biocampovet.core.animal.enums.AnimalSpecies;
import com.gaedet.biocampovet.core.animal.repository.AnimalRepository;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryAnimalSummaryResponse;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.Consultation;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.EvolutionNoteEntry;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.GroomingEntry;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.HospitalizationRecord;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.LabParameter;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.LabResult;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.Medication;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.OwnerInfo;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.PatientInfo;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.PreventiveCare;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.PreventiveEvent;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.Procedure;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.ProcedureType;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.ServiceItem;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.TreatmentScheduleEntry;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.TreatmentProductUsageEntry;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.Vitals;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryDetailResponse.WeightEntry;
import com.gaedet.biocampovet.core.clinic.dto.history.ClinicalHistoryLatestAttentionProjection;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalAttention;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalService;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalServiceItem;
import com.gaedet.biocampovet.core.clinic.entity.GroomingSession;
import com.gaedet.biocampovet.core.clinic.entity.Hospitalization;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryRequest;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryRequestItem;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryResultValue;
import com.gaedet.biocampovet.core.clinic.entity.MedicationAdministration;
import com.gaedet.biocampovet.core.clinic.entity.SurgicalReport;
import com.gaedet.biocampovet.core.clinic.entity.TreatmentSchedule;
import com.gaedet.biocampovet.core.clinic.entity.TreatmentScheduleProductUsage;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.biocampovet.core.clinic.enums.LabUnit;
import com.gaedet.biocampovet.core.clinic.specs.*;
import com.gaedet.biocampovet.core.global.enums.TimeUnit;
import com.gaedet.biocampovet.core.clinic.repository.ClinicalAttentionRepository;
import com.gaedet.biocampovet.core.clinic.repository.GroomingSessionRepository;
import com.gaedet.biocampovet.core.clinic.repository.HospitalizationRepository;
import com.gaedet.biocampovet.core.clinic.repository.LaboratoryRequestRepository;
import com.gaedet.biocampovet.core.clinic.repository.SurgicalReportRepository;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Period;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.toList;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClinicalHistoryQueryService {

    private final AnimalRepository animalRepository;
    private final ClinicalAttentionRepository clinicalAttentionRepository;
    private final LaboratoryRequestRepository laboratoryRequestRepository;
    private final SurgicalReportRepository surgicalReportRepository;
    private final GroomingSessionRepository groomingSessionRepository;
    private final HospitalizationRepository hospitalizationRepository;

    public PaginatedResponse<ClinicalHistoryAnimalSummaryResponse> searchAnimals(
            String query,
            List<AnimalSpecies> species,
            Boolean active,
            int page,
            int size
    ) {
        String normalizedQuery = normalize(query);
        List<AnimalSpecies> speciesFilter = (species == null || species.isEmpty()) ? null : species;

        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Animal> animalPage = animalRepository.searchForClinicalHistory(normalizedQuery, speciesFilter, active, pageable);

        Set<Long> animalIds = animalPage.stream()
                .map(Animal::getId)
                .collect(Collectors.toSet());

        Map<Long, Long> consultationCount = toCountMap(clinicalAttentionRepository.countByAnimalIds(animalIds));
        Map<Long, Long> labCount = toCountMap(laboratoryRequestRepository.countByAnimalIds(animalIds));
        Map<Long, Long> surgeryCount = toCountMap(surgicalReportRepository.countByAnimalIds(animalIds));
        Map<Long, Long> hospitalizationCount = toCountMap(hospitalizationRepository.countByAnimalIds(animalIds));

        Map<Long, ClinicalHistoryLatestAttentionProjection> latestProjection = findLatestProjection(animalIds);
        Map<Long, ClinicalAttention> latestAttentionDetails = findAttentions(latestProjection.values());

        List<ClinicalHistoryAnimalSummaryResponse> content = animalPage.stream()
                .map(animal -> buildAnimalSummary(
                        animal,
                        latestProjection.get(animal.getId()),
                        latestAttentionDetails,
                        consultationCount,
                        labCount,
                        surgeryCount,
                        hospitalizationCount
                )).collect(toList());

        return PaginatedResponse.<ClinicalHistoryAnimalSummaryResponse>builder()
                .content(content)
                .totalElements(animalPage.getTotalElements())
                .totalPages(animalPage.getTotalPages())
                .currentPage(animalPage.getNumber())
                .pageSize(animalPage.getSize())
                .build();
    }

    public ClinicalHistoryDetailResponse getAnimalHistory(Long animalId, LocalDate from, LocalDate to) {
        Animal animal = animalRepository.findWithDetailsById(animalId)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el paciente con id " + animalId));

        LocalDateTime fromDateTime = (from != null) ? from.atStartOfDay() : null;
        LocalDateTime toDateTime   = (to != null)   ? LocalDateTime.of(to, LocalTime.MAX) : null;

        List<ClinicalAttention> consultations = clinicalAttentionRepository.findAll(
                ClinicalAttentionSpecs.byAnimalAndVisitRange(animalId, fromDateTime, toDateTime),
                Sort.by(Sort.Direction.DESC, "visitDate")
        );
        if (!consultations.isEmpty()) {
            consultations = clinicalAttentionRepository.loadServiceItemsFor(consultations);
        }
        List<ClinicalAttention> distinctConsultations = new ArrayList<>(new LinkedHashSet<>(consultations));

        List<LaboratoryRequest> laboratoryRequests = laboratoryRequestRepository.findAll(
                LaboratoryRequestSpecs.byAnimalAndCreatedRange(animalId, fromDateTime, toDateTime),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        List<SurgicalReport> surgicalReports = surgicalReportRepository.findAll(
                SurgicalReportSpecs.byAnimalAndSurgeryRange(animalId, fromDateTime, toDateTime),
                Sort.by(Sort.Direction.DESC, "surgeryStartAt")
        );

        surgicalReports.sort(Comparator.comparing(
                (SurgicalReport sr) -> sr.getSurgeryStartAt() != null ? sr.getSurgeryStartAt() : sr.getSurgeryEndAt(),
                Comparator.nullsLast(LocalDateTime::compareTo)
        ).reversed());

        List<GroomingSession> groomingSessions = groomingSessionRepository.findAll(
                GroomingSessionSpecs.byAnimalAndTimeRange(animalId, fromDateTime, toDateTime),
                Sort.by(Sort.Direction.DESC, "startedAt")
        );
        groomingSessions.sort(Comparator.comparing(
                (GroomingSession gs) -> gs.getStartedAt() != null ? gs.getStartedAt() : gs.getFinishedAt(),
                Comparator.nullsLast(LocalDateTime::compareTo)
        ).reversed());

        List<Hospitalization> hospitalizations = hospitalizationRepository.findAll(
                HospitalizationSpecification.byAnimalAndAdmissionDischargeRange(animalId, fromDateTime, toDateTime),
                Sort.by(Sort.Direction.DESC, "admissionDate")
        );
        if (!hospitalizations.isEmpty()) {
            hospitalizations = hospitalizationRepository.loadEvolutionNotesFor(hospitalizations);
        }
        List<Hospitalization> distinctHospitalizations = new ArrayList<>(new LinkedHashSet<>(hospitalizations));

        Consultation lastConsultation = distinctConsultations.stream()
                .findFirst()
                .map(this::toConsultationDto)
                .orElse(null);

        List<Consultation> consultationDtos = distinctConsultations.stream()
                .map(this::toConsultationDto)
                .collect(toList());

        List<Procedure> procedures = buildProcedures(surgicalReports, distinctHospitalizations);
        PreventiveCare preventiveCare = buildPreventiveCare(distinctConsultations, groomingSessions);
        List<LabResult> labResults = buildLabResults(laboratoryRequests);
        List<WeightEntry> weightEntries = buildWeightHistory(distinctConsultations);
        PatientInfo patientInfo = buildPatientInfo(animal, lastConsultation);

        List<HospitalizationRecord> hospitalizationRecords = distinctHospitalizations.stream()
                .map(this::toHospitalizationRecord)
                .collect(toList());

        return ClinicalHistoryDetailResponse.builder()
                .patient(patientInfo)
                .lastConsultation(lastConsultation)
                .consultations(consultationDtos)
                .procedures(procedures)
                .preventiveCare(preventiveCare)
                .labResults(labResults)
                .weightHistory(weightEntries)
                .hospitalizations(hospitalizationRecords)
                .build();
    }

    private ClinicalHistoryAnimalSummaryResponse buildAnimalSummary(
            Animal animal,
            ClinicalHistoryLatestAttentionProjection projection,
            Map<Long, ClinicalAttention> attentionMap,
            Map<Long, Long> consultationCount,
            Map<Long, Long> labCount,
            Map<Long, Long> surgeryCount,
            Map<Long, Long> hospitalizationCount
    ) {
        Long animalId = animal.getId();
        ClinicalAttention latestAttention = projection != null
                ? attentionMap.get(projection.getClinicalAttentionId())
                : null;

        Double lastWeight = latestAttention != null ? latestAttention.getWeightKg() : null;
        String lastService = latestAttention != null && latestAttention.getAttention() != null
                && latestAttention.getAttention().getService() != null
                ? latestAttention.getAttention().getService().getName()
                : null;
        String lastVeterinarian = latestAttention != null && latestAttention.getAttention() != null
                && latestAttention.getAttention().getAttendingEmployee() != null
                ? latestAttention.getAttention().getAttendingEmployee().getFullName()
                : null;

        return ClinicalHistoryAnimalSummaryResponse.builder()
                .animalId(animalId)
                .animalName(animal.getName())
                .species(animal.getSpecies())
                .speciesLabel(formatSpecies(animal.getSpecies()))
                .breed(animal.getBreed())
                .sex(animal.getSex())
                .ownerName(animal.getOwner() != null ? animal.getOwner().getName() : null)
                .ownerPhone(animal.getOwner() != null ? animal.getOwner().getPhoneNumber() : null)
                .ownerEmail(animal.getOwner() != null ? animal.getOwner().getEmail() : null)
                .microchip(animal.getMicrochipNumber())
                .birthDate(animal.getBirthDate())
                .age(formatAge(animal.getBirthDate()))
                .active(animal.isActive())
                .lastVisitDate(projection != null ? projection.getVisitDate() : null)
                .lastVisitService(lastService)
                .lastVeterinarian(lastVeterinarian)
                .totalConsultations(consultationCount.getOrDefault(animalId, 0L))
                .totalLabRequests(labCount.getOrDefault(animalId, 0L))
                .totalProcedures(surgeryCount.getOrDefault(animalId, 0L) + hospitalizationCount.getOrDefault(animalId, 0L))
                .lastRecordedWeightKg(lastWeight)
                .build();
    }

    private PatientInfo buildPatientInfo(Animal animal, Consultation lastConsultation) {
        Set<String> allergies = animal.getAllergies() == null ? Set.of() : new HashSet<>(animal.getAllergies());
        Set<String> chronic   = animal.getChronicConditions() == null ? Set.of() : new HashSet<>(animal.getChronicConditions());

        return PatientInfo.builder()
                .animalId(animal.getId())
                .name(animal.getName())
                .photoUrl(animal.getPhotoUrl())
                .species(animal.getSpecies())
                .speciesLabel(formatSpecies(animal.getSpecies()))
                .breed(animal.getBreed())
                .sex(animal.getSex())
                .sexLabel(formatSex(animal.getSex()))
                .birthDate(animal.getBirthDate())
                .age(formatAge(animal.getBirthDate()))
                .microchip(animal.getMicrochipNumber())
                .active(animal.isActive())
                .allergies(allergies)
                .chronicConditions(chronic)
                .owner(toOwnerInfo(animal))
                .lastVisitDate(lastConsultation != null ? lastConsultation.getVisitDate() : null)
                .lastVisitService(lastConsultation != null ? lastConsultation.getClinicalServiceName() : null)
                .lastVeterinarian(lastConsultation != null ? lastConsultation.getVeterinarian() : null)
                .build();
    }

    private OwnerInfo toOwnerInfo(Animal animal) {
        if (animal.getOwner() == null) {
            return null;
        }
        return OwnerInfo.builder()
                .id(animal.getOwner().getId())
                .name(animal.getOwner().getName())
                .email(animal.getOwner().getEmail())
                .phoneNumber(animal.getOwner().getPhoneNumber())
                .address(animal.getOwner().getAddress())
                .documentType(animal.getOwner().getDocumentType() != null
                        ? Optional.ofNullable(animal.getOwner().getDocumentType().getAbbreviation())
                        .filter(abbrev -> !abbrev.isBlank())
                        .orElse(animal.getOwner().getDocumentType().getName())
                        : null)
                .documentNumber(animal.getOwner().getDocumentNumber())
                .build();
    }

    private Consultation toConsultationDto(ClinicalAttention clinicalAttention) {
        String reason = Optional.ofNullable(clinicalAttention.getAttention())
                .map(attention -> {
                    if (attention.getAppointment() != null && attention.getAppointment().getClinicalDetail() != null) {
                        return attention.getAppointment().getClinicalDetail().getConsultationReason();
                    }
                    ClinicalService service = attention.getService();
                    if (service != null && service.getDescription() != null && !service.getDescription().isBlank()) {
                        return service.getDescription();
                    }
                    return null;
                }).orElse(null);

        ClinicalServiceCategory category = Optional.ofNullable(clinicalAttention.getAttention())
                .map(att -> att.getService() != null ? att.getService().getClinicalServiceCategory() : null)
                .orElse(null);

        Vitals vitals = Vitals.builder()
                .weightKg(clinicalAttention.getWeightKg())
                .temperatureCelsius(clinicalAttention.getTemperatureCelsius())
                .heartRate(clinicalAttention.getHeartRate())
                .respiratoryRate(clinicalAttention.getRespiratoryRate())
                .build();

        List<Medication> medications = clinicalAttention.getMedicationAdministrations().stream()
                .sorted(Comparator.comparing(MedicationAdministration::getAdministeredAt, Comparator.nullsLast(LocalDateTime::compareTo)).reversed())
                .map(this::toMedication)
                .collect(toList());

        List<ServiceItem> services = clinicalAttention.getServiceItems().stream()
                .sorted(Comparator.comparing(ClinicalServiceItem::getId, Comparator.nullsLast(Long::compareTo)))
                .map(item -> ServiceItem.builder()
                        .id(item.getId())
                        .clinicalServiceName(item.getClinicalService() != null ? item.getClinicalService().getName() : null)
                        .category(item.getClinicalService() != null ? item.getClinicalService().getClinicalServiceCategory() : null)
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .notes(item.getNotes())
                        .build())
                .collect(toList());

        return Consultation.builder()
                .id(clinicalAttention.getId())
                .visitDate(clinicalAttention.getVisitDate())
                .serviceCategory(category)
                .clinicalServiceName(Optional.ofNullable(clinicalAttention.getAttention())
                        .map(att -> att.getService() != null ? att.getService().getName() : null)
                        .orElse(null))
                .veterinarian(Optional.ofNullable(clinicalAttention.getAttention())
                        .map(att -> att.getAttendingEmployee() != null ? att.getAttendingEmployee().getFullName() : null)
                        .orElse(null))
                .branchName(Optional.ofNullable(clinicalAttention.getAttention())
                        .map(att -> att.getBranch() != null ? att.getBranch().getName() : null)
                        .orElse(null))
                .reasonForVisit(reason)
                .vitals(vitals)
                .subjective(clinicalAttention.getSubjective())
                .objective(clinicalAttention.getObjective())
                .diagnosis(clinicalAttention.getAssessment())
                .treatment(clinicalAttention.getPlan())
                .notes(clinicalAttention.getObjective())
                .medications(medications)
                .additionalServices(services)
                .build();
    }

    private Medication toMedication(MedicationAdministration administration) {
        return Medication.builder()
                .id(administration.getId())
                .productName(administration.getProduct() != null ? administration.getProduct().getName() : null)
                .doseAmount(administration.getDoseAmount())
                .doseUnit(administration.getDoseUnit() != null ? administration.getDoseUnit().name() : null)
                .route(administration.getRoute() != null ? administration.getRoute().name() : null)
                .frequencyValue(administration.getFrequencyValue())
                .frequencyUnit(administration.getFrequencyUnit() != null ? administration.getFrequencyUnit().name() : null)
                .administeredAt(administration.getAdministeredAt())
                .administeredBy(administration.getAdministeredBy() != null ? administration.getAdministeredBy().getFullName() : null)
                .notes(administration.getNotes())
                .build();
    }

    private PreventiveCare buildPreventiveCare(List<ClinicalAttention> consultations, List<GroomingSession> groomingSessions) {
        List<PreventiveEvent> vaccines = new ArrayList<>();
        List<PreventiveEvent> deworming = new ArrayList<>();

        for (ClinicalAttention attention : consultations) {
            LocalDateTime performedAt = attention.getVisitDate();
            String veterinarian = Optional.ofNullable(attention.getAttention())
                    .map(att -> att.getAttendingEmployee() != null ? att.getAttendingEmployee().getFullName() : null)
                    .orElse(null);

            attention.getServiceItems().forEach(item -> {
                ClinicalService service = item.getClinicalService();
                if (service == null || service.getClinicalServiceCategory() == null) {
                    return;
                }
                if (service.getClinicalServiceCategory() == ClinicalServiceCategory.VACCINATION
                        || service.getClinicalServiceCategory() == ClinicalServiceCategory.DEWORMING) {
                    PreventiveEvent event = PreventiveEvent.builder()
                            .serviceItemId(item.getId())
                            .serviceName(service.getName())
                            .category(service.getClinicalServiceCategory())
                            .performedAt(performedAt)
                            .nextDueDate(calculateNextDueDate(performedAt, service))
                            .veterinarian(veterinarian)
                            .notes(item.getNotes())
                            .build();
                    if (service.getClinicalServiceCategory() == ClinicalServiceCategory.VACCINATION) {
                        vaccines.add(event);
                    } else {
                        deworming.add(event);
                    }
                }
            });
        }

        List<GroomingEntry> groomingEntries = groomingSessions.stream()
                .map(this::toGroomingEntry)
                .collect(toList());

        return PreventiveCare.builder()
                .vaccines(vaccines)
                .deworming(deworming)
                .groomingSessions(groomingEntries)
                .build();
    }

    private List<Procedure> buildProcedures(List<SurgicalReport> surgicalReports, List<Hospitalization> hospitalizations) {
        List<Procedure> procedures = new ArrayList<>();
        for (SurgicalReport report : surgicalReports) {
            procedures.add(Procedure.builder()
                    .id(report.getId())
                    .type(ProcedureType.SURGERY)
                    .title(Optional.ofNullable(report.getAttention())
                            .map(att -> att.getService() != null ? att.getService().getName() : "Procedimiento quirúrgico")
                            .orElse("Procedimiento quirúrgico"))
                    .startedAt(report.getSurgeryStartAt())
                    .endedAt(report.getSurgeryEndAt())
                    .professionalInCharge(report.getSurgeon() != null ? report.getSurgeon().getFullName() : null)
                    .notes(report.getFindings())
                    .status(report.getStatus() != null ? report.getStatus().name() : null)
                    .build());
        }
        for (Hospitalization hospitalization : hospitalizations) {
            procedures.add(Procedure.builder()
                    .id(hospitalization.getId())
                    .type(ProcedureType.HOSPITALIZATION)
                    .title(Optional.ofNullable(hospitalization.getClinicalService())
                            .map(ClinicalService::getName)
                            .orElse("Hospitalización"))
                    .startedAt(hospitalization.getAdmissionDate())
                    .endedAt(hospitalization.getDischargeDate())
                    .professionalInCharge(Optional.ofNullable(hospitalization.getAttention())
                            .map(att -> att.getAttendingEmployee() != null ? att.getAttendingEmployee().getFullName() : null)
                            .orElse(null))
                    .notes(hospitalization.getAdmissionNotes())
                    .status(hospitalization.getStatus() != null ? hospitalization.getStatus().name() : null)
                    .build());
        }
        procedures.sort(Comparator.comparing(Procedure::getStartedAt, Comparator.nullsLast(LocalDateTime::compareTo)).reversed());
        return procedures;
    }

    private List<LabResult> buildLabResults(List<LaboratoryRequest> requests) {
        List<LabResult> results = new ArrayList<>();
        for (LaboratoryRequest request : requests) {
            for (LaboratoryRequestItem item : request.getItems()) {
                LabResult result = LabResult.builder()
                        .requestId(request.getId())
                        .laboratoryName(request.getLaboratory() != null ? request.getLaboratory().getName() : null)
                        .requestingVeterinarian(request.getRequestingEmployee() != null ? request.getRequestingEmployee().getFullName() : null)
                        .requestedAt(request.getCreatedAt())
                        .reportedAt(item.getReportedAt())
                        .status(request.getStatus())
                        .testName(item.getTest() != null ? item.getTest().getName() : null)
                        .clinicalNotes(request.getClinicalNotes())
                        .parameters(item.getResults().stream()
                                .map(this::toLabParameter)
                                .collect(toList()))
                        .build();
                results.add(result);
            }
        }
        results.sort(Comparator.comparing(LabResult::getRequestedAt, Comparator.nullsLast(LocalDateTime::compareTo)).reversed());
        return results;
    }

    private LabParameter toLabParameter(LaboratoryResultValue value) {
        String unit = value.getUnitOverride();
        if (unit == null && value.getParameter() != null && value.getParameter().getUnit() != null) {
            LabUnit labUnit = value.getParameter().getUnit();
            unit = labUnit.name();
        }
        String reference = buildReferenceRange(value);

        String formattedValue;
        if (value.getNumericValue() != null) {
            int decimals = Optional.ofNullable(value.getParameter())
                    .map(param -> param.getDecimals() != null ? param.getDecimals() : 2)
                    .orElse(2);
            BigDecimal number = BigDecimal.valueOf(value.getNumericValue());
            formattedValue = number.setScale(decimals, RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
        } else if (value.getTextValue() != null) {
            formattedValue = value.getTextValue();
        } else if (value.getBooleanValue() != null) {
            formattedValue = value.getBooleanValue() ? "Positivo" : "Negativo";
        } else {
            formattedValue = null;
        }

        return LabParameter.builder()
                .name(value.getParameter() != null ? value.getParameter().getName() : null)
                .value(formattedValue)
                .unit(unit)
                .referenceRange(reference)
                .flag(value.getFlag())
                .comment(value.getComment())
                .build();
    }

    private List<WeightEntry> buildWeightHistory(List<ClinicalAttention> consultations) {
        return consultations.stream()
                .filter(attention -> attention.getWeightKg() != null)
                .map(attention -> WeightEntry.builder()
                        .recordedAt(attention.getVisitDate())
                        .weightKg(attention.getWeightKg())
                        .sourceClinicalAttentionId(attention.getId())
                        .build())
                .sorted(Comparator.comparing(WeightEntry::getRecordedAt, Comparator.nullsLast(LocalDateTime::compareTo)))
                .collect(toList());
    }

    private GroomingEntry toGroomingEntry(GroomingSession session) {
        return GroomingEntry.builder()
                .id(session.getId())
                .serviceName(Optional.ofNullable(session.getAttention())
                        .map(att -> att.getService() != null ? att.getService().getName() : "Grooming")
                        .orElse("Grooming"))
                .status(session.getStatus())
                .startedAt(session.getStartedAt())
                .finishedAt(session.getFinishedAt())
                .assignedProfessional(session.getAssignedProfessional() != null ? session.getAssignedProfessional().getFullName() : null)
                .behaviorNotes(session.getBehaviorNotes())
                .clinicalObservations(session.getClinicalObservations())
                .build();
    }

    private HospitalizationRecord toHospitalizationRecord(Hospitalization hospitalization) {
        List<TreatmentScheduleEntry> schedules = Optional.ofNullable(hospitalization.getTreatmentSchedules())
                .orElseGet(Collections::emptyList)
                .stream()
                .map(this::toTreatmentSchedule)
                .sorted(Comparator.comparing(TreatmentScheduleEntry::getScheduledTime))
                .collect(toList());

        List<EvolutionNoteEntry> notes = Optional.ofNullable(hospitalization.getEvolutionNotes())
                .orElseGet(Collections::emptyList)
                .stream()
                .map(note -> EvolutionNoteEntry.builder()
                        .id(note.getId())
                        .timestamp(note.getTimestamp())
                        .author(note.getAuthor() != null ? note.getAuthor().getFullName() : null)
                        .note(note.getNote())
                        .build())
                .sorted(Comparator.comparing(EvolutionNoteEntry::getTimestamp))
                .collect(toList());

        return HospitalizationRecord.builder()
                .id(hospitalization.getId())
                .admissionDate(hospitalization.getAdmissionDate())
                .dischargeDate(hospitalization.getDischargeDate())
                .status(hospitalization.getStatus())
                .cause(hospitalization.getCause())
                .clinicalServiceName(hospitalization.getClinicalService() != null ? hospitalization.getClinicalService().getName() : null)
                .attendingEmployee(Optional.ofNullable(hospitalization.getAttention())
                        .map(att -> att.getAttendingEmployee() != null ? att.getAttendingEmployee().getFullName() : null)
                        .orElse(null))
                .admissionNotes(hospitalization.getAdmissionNotes())
                .treatmentSchedules(schedules)
                .evolutionNotes(notes)
                .build();
    }

    private TreatmentScheduleEntry toTreatmentSchedule(TreatmentSchedule schedule) {
        return TreatmentScheduleEntry.builder()
                .id(schedule.getId())
                .treatmentName(schedule.getTreatmentName())
                .scheduledTime(schedule.getScheduledTime())
                .completed(schedule.isCompleted())
                .completedAt(schedule.getCompletedAt())
                .completedBy(schedule.getCompletedBy() != null ? schedule.getCompletedBy().getFullName() : null)
                .notes(schedule.getNotes())
                .products(Optional.ofNullable(schedule.getProductUsages())
                        .orElseGet(Collections::emptyList)
                        .stream()
                        .map(this::toTreatmentProductUsage)
                        .collect(toList()))
                .build();
    }

    private TreatmentProductUsageEntry toTreatmentProductUsage(TreatmentScheduleProductUsage usage) {
        return TreatmentProductUsageEntry.builder()
                .id(usage.getId())
                .productId(usage.getProduct() != null ? usage.getProduct().getId() : null)
                .productName(usage.getProduct() != null ? usage.getProduct().getName() : null)
                .quantity(usage.getQuantity())
                .unit(usage.getUnit())
                .build();
    }

    private Map<Long, ClinicalAttention> findAttentions(Collection<ClinicalHistoryLatestAttentionProjection> projections) {
        if (projections == null || projections.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<Long> attentionIds = projections.stream()
                .map(ClinicalHistoryLatestAttentionProjection::getClinicalAttentionId)
                .collect(Collectors.toSet());
        if (attentionIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return clinicalAttentionRepository.findByIdIn(attentionIds).stream()
                .collect(Collectors.toMap(ClinicalAttention::getId, Function.identity()));
    }

    private Map<Long, ClinicalHistoryLatestAttentionProjection> findLatestProjection(Set<Long> animalIds) {
        if (animalIds == null || animalIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return clinicalAttentionRepository.findLatestByAnimalIds(animalIds).stream()
                .collect(Collectors.toMap(
                        ClinicalHistoryLatestAttentionProjection::getAnimalId,
                        Function.identity(),
                        (first, second) -> second
                ));
    }

    private Map<Long, Long> toCountMap(List<Object[]> tuples) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] tuple : tuples) {
            if (tuple.length >= 2) {
                Long key = tuple[0] != null ? ((Number) tuple[0]).longValue() : null;
                Long value = tuple[1] != null ? ((Number) tuple[1]).longValue() : null;
                if (key != null && value != null) {
                    map.put(key, value);
                }
            }
        }
        return map;
    }

    private String buildReferenceRange(LaboratoryResultValue value) {
        if (value.getParameter() == null) {
            return null;
        }
        if (value.getParameter().getRefText() != null && !value.getParameter().getRefText().isBlank()) {
            return value.getParameter().getRefText();
        }
        Double min = value.getParameter().getRefMin();
        Double max = value.getParameter().getRefMax();
        if (min == null && max == null) {
            return null;
        }
        if (min != null && max != null) {
            return formatNumber(min) + " - " + formatNumber(max);
        }
        if (min != null) {
            return "Desde " + formatNumber(min);
        }
        return "Hasta " + formatNumber(max);
    }

    private String formatNumber(Double number) {
        return BigDecimal.valueOf(number)
                .setScale(2, RoundingMode.HALF_UP)
                .stripTrailingZeros()
                .toPlainString();
    }

    private LocalDate calculateNextDueDate(LocalDateTime performedAt, ClinicalService service) {
        if (performedAt == null || service == null || service.getReminderPeriod() == null || service.getReminderPeriodUnit() == null) {
            return null;
        }
        LocalDate date = performedAt.toLocalDate();
        TimeUnit unit = service.getReminderPeriodUnit();
        Integer period = service.getReminderPeriod();
        if (period == null || period <= 0) {
            return null;
        }
        return switch (unit) {
            case DAYS -> date.plusDays(period);
            case WEEKS -> date.plusWeeks(period);
            case MONTHS -> date.plusMonths(period);
        };
    }

    private String formatSpecies(AnimalSpecies species) {
        if (species == null) {
            return null;
        }
        return switch (species) {
            case CANINE -> "Canino";
            case FELINE -> "Felino";
            case RABBIT -> "Conejo";
            case HAMSTER -> "Hámster";
            case GUINEA_PIG -> "Cobayo/Cuyo";
            case AVIAN -> "Ave";
            case REPTILE -> "Reptil";
            case EQUINE -> "Equino";
            case BOVINE -> "Bovino";
            case OVINE -> "Ovino";
            case CAPRINE -> "Caprino";
            case PORCINE -> "Porcino";
            case CAMELID -> "Camélido";
            case OTHER -> "Otro";
        };
    }

    private String formatSex(AnimalSex sex) {
        if (sex == null) {
            return null;
        }
        return switch (sex) {
            case MALE -> "Macho";
            case FEMALE -> "Hembra";
            case CASTRATED_MALE -> "Macho castrado";
            case SPAYED_FEMALE -> "Hembra esterilizada";
        };
    }

    private String formatAge(LocalDate birthDate) {
        if (birthDate == null) {
            return null;
        }
        Period period = Period.between(birthDate, LocalDate.now());
        List<String> parts = new ArrayList<>();
        if (period.getYears() > 0) {
            parts.add(period.getYears() + " año" + (period.getYears() == 1 ? "" : "s"));
        }
        if (period.getMonths() > 0) {
            parts.add(period.getMonths() + " mes" + (period.getMonths() == 1 ? "" : "es"));
        }
        if (parts.isEmpty()) {
            parts.add(period.getDays() + " día" + (period.getDays() == 1 ? "" : "s"));
        }
        return String.join(" ", parts);
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
