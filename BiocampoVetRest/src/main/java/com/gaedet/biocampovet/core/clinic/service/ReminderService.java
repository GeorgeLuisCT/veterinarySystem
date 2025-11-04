package com.gaedet.biocampovet.core.clinic.service;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.animal.repository.AnimalRepository;
import com.gaedet.biocampovet.core.clinic.dto.reminder.ReminderCreateRequest;
import com.gaedet.biocampovet.core.clinic.dto.reminder.ReminderListItemResponse;
import com.gaedet.biocampovet.core.clinic.dto.reminder.ReminderQueryFilters;
import com.gaedet.biocampovet.core.clinic.entity.ClinicalServiceItem;
import com.gaedet.biocampovet.core.clinic.entity.Reminder;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalServiceCategory;
import com.gaedet.biocampovet.core.clinic.enums.ReminderStatus;
import com.gaedet.biocampovet.core.clinic.enums.ReminderType;
import com.gaedet.biocampovet.core.clinic.repository.ClinicalServiceItemRepository;
import com.gaedet.biocampovet.core.clinic.repository.ReminderRepository;
import com.gaedet.biocampovet.core.clinic.specs.ReminderSpecs;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final ClinicalServiceItemRepository clinicalServiceItemRepository;
    private final AnimalRepository animalRepository;

    public PaginatedResponse<ReminderListItemResponse> list(ReminderQueryFilters filters, int page, int size) {
        List<ReminderListItemResponse> manual = filters.isIncludeManual()
                ? loadManualReminders(filters)
                : List.of();

        List<ReminderListItemResponse> automatic = filters.isIncludeAutomatic()
                ? loadAutomaticReminders(filters)
                : List.of();

        List<ReminderListItemResponse> combined = Stream.concat(manual.stream(), automatic.stream())
                .sorted(Comparator.comparing(ReminderListItemResponse::dueDate)
                        .thenComparing(ReminderListItemResponse::automatic)
                        .thenComparing(ReminderListItemResponse::subject, Comparator.nullsLast(String::compareToIgnoreCase)))
                .collect(Collectors.toList());

        if (size <= 0) {
            size = 10;
        }
        int total = combined.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);
        List<ReminderListItemResponse> content = combined.subList(fromIndex, toIndex);
        int totalPages = (int) Math.ceil(total / (double) size);

        return PaginatedResponse.<ReminderListItemResponse>builder()
                .content(content)
                .totalElements(total)
                .totalPages(totalPages)
                .currentPage(page)
                .pageSize(size)
                .build();
    }

    @Transactional
    public ReminderListItemResponse create(ReminderCreateRequest request) {
        Animal animal = animalRepository.findWithDetailsById(request.getAnimalId())
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el animal con id " + request.getAnimalId()));

        Reminder reminder = Reminder.builder()
                .animal(animal)
                .reminderType(request.getReminderType())
                .dueDate(request.getDueDate())
                .status(ReminderStatus.PENDING)
                .build();

        Reminder saved = reminderRepository.save(reminder);
        return mapManualReminder(saved);
    }

    @Transactional
    public void delete(Long id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el recordatorio con id " + id));
        reminderRepository.delete(reminder);
    }

    private List<ReminderListItemResponse> loadManualReminders(ReminderQueryFilters filters) {
        var specification = ReminderSpecs.withQueryFilters(
                filters.getQuery(),
                filters.getTypes(),
                filters.getStatuses(),
                filters.getDueFrom(),
                filters.getDueTo()
        );

        List<Reminder> reminders = reminderRepository.findAll(
                specification,
                Sort.by(Sort.Direction.ASC, "dueDate").and(Sort.by("id"))
        );
        return reminders.stream()
                .map(this::mapManualReminder)
                .collect(Collectors.toList());
    }

    private ReminderListItemResponse mapManualReminder(Reminder reminder) {
        var animal = reminder.getAnimal();
        var owner = animal.getOwner();
        String subject = "Recordatorio manual • " + formatReminderType(reminder.getReminderType());

        return new ReminderListItemResponse(
                reminder.getId(),
                null,
                false,
                true,
                reminder.getReminderType(),
                reminder.getStatus(),
                reminder.getDueDate(),
                subject,
                null,
                animal.getId(),
                animal.getName(),
                animal.getSpecies(),
                owner != null ? owner.getId() : null,
                owner != null ? owner.getName() : null,
                owner != null ? owner.getPhoneNumber() : null,
                owner != null ? owner.getEmail() : null,
                null
        );
    }

    private List<ReminderListItemResponse> loadAutomaticReminders(ReminderQueryFilters filters) {
        List<ClinicalServiceItem> items = clinicalServiceItemRepository.findAllWithReminder();
        if (items.isEmpty()) {
            return List.of();
        }

        String normalizedQuery = filters.getQuery() != null ? filters.getQuery().trim().toLowerCase(Locale.ROOT) : null;
        LocalDate dueFrom = filters.getDueFrom();
        LocalDate dueTo = filters.getDueTo();
        List<ReminderType> allowedTypes = filters.getTypes();
        List<ReminderStatus> allowedStatuses = filters.getStatuses();

        LocalDate today = LocalDate.now();

        List<ReminderListItemResponse> responses = new ArrayList<>();
        for (ClinicalServiceItem item : items) {
            if (item.getClinicalAttention() == null || item.getClinicalAttention().getAttention() == null) {
                continue;
            }

            var attention = item.getClinicalAttention();
            LocalDateTime visitDateTime = attention.getVisitDate();
            if (visitDateTime == null) {
                continue;
            }

            var service = item.getClinicalService();
            if (service == null || service.getReminderPeriod() == null || service.getReminderPeriodUnit() == null) {
                continue;
            }

            ReminderType reminderType = mapReminderType(service.getClinicalServiceCategory());
            if (allowedTypes != null && !allowedTypes.isEmpty() && !allowedTypes.contains(reminderType)) {
                continue;
            }

            LocalDate dueDate = calculateDueDate(visitDateTime.toLocalDate(), service.getReminderPeriod(), service.getReminderPeriodUnit());
            if (dueDate == null) {
                continue;
            }

            if (dueFrom != null && dueDate.isBefore(dueFrom)) {
                continue;
            }
            if (dueTo != null && dueDate.isAfter(dueTo)) {
                continue;
            }

            ReminderStatus status = dueDate.isBefore(today) ? ReminderStatus.PENDING : ReminderStatus.PENDING;
            if (allowedStatuses != null && !allowedStatuses.isEmpty() && !allowedStatuses.contains(status)) {
                continue;
            }

            var attentionWrapper = attention.getAttention();
            var animal = attentionWrapper.getAnimal();
            if (animal == null) {
                continue;
            }

            var owner = animal.getOwner();
            if (normalizedQuery != null && !normalizedQuery.isBlank()) {
                boolean matches = false;
                String animalName = animal.getName() != null ? animal.getName().toLowerCase(Locale.ROOT) : "";
                String ownerName = owner != null && owner.getName() != null ? owner.getName().toLowerCase(Locale.ROOT) : "";
                String microchip = animal.getMicrochipNumber() != null ? animal.getMicrochipNumber().toLowerCase(Locale.ROOT) : "";
                if (animalName.contains(normalizedQuery) || ownerName.contains(normalizedQuery) || microchip.contains(normalizedQuery)) {
                    matches = true;
                }

                if (!matches) {
                    continue;
                }
            }

            String branchName = attentionWrapper.getBranch() != null ? attentionWrapper.getBranch().getName() : null;
            String serviceName = service.getName();
            String subject = formatReminderType(reminderType) + " • " + (serviceName != null ? serviceName : "Servicio clínico");
            String detail = buildAutomaticDetail(serviceName, attentionWrapper.getAttendingEmployee() != null ? attentionWrapper.getAttendingEmployee().getFullName() : null, visitDateTime.toLocalDate());

            responses.add(new ReminderListItemResponse(
                    null,
                    "svc-" + item.getId(),
                    true,
                    false,
                    reminderType,
                    status,
                    dueDate,
                    subject,
                    detail,
                    animal.getId(),
                    animal.getName(),
                    animal.getSpecies(),
                    owner != null ? owner.getId() : null,
                    owner != null ? owner.getName() : null,
                    owner != null ? owner.getPhoneNumber() : null,
                    owner != null ? owner.getEmail() : null,
                    branchName
            ));
        }

        return responses;
    }

    private LocalDate calculateDueDate(LocalDate baseDate, Integer period, com.gaedet.biocampovet.core.global.enums.TimeUnit unit) {
        if (baseDate == null || period == null || unit == null) {
            return null;
        }
        return switch (unit) {
            case DAYS -> baseDate.plus(period, ChronoUnit.DAYS);
            case WEEKS -> baseDate.plus(period, ChronoUnit.WEEKS);
            case MONTHS -> baseDate.plus(period, ChronoUnit.MONTHS);
        };
    }

    private ReminderType mapReminderType(ClinicalServiceCategory category) {
        if (category == null) {
            return ReminderType.OTHER;
        }
        return switch (category) {
            case VACCINATION -> ReminderType.VACCINATION;
            case DEWORMING -> ReminderType.DEWORMING;
            case GROOMING -> ReminderType.GROOMING;
            case SURGERY -> ReminderType.SURGERY_FOLLOWUP;
            case LABORATORY -> ReminderType.LAB_TEST;
            case CONSULTATION -> ReminderType.CHECKUP;
            default -> ReminderType.OTHER;
        };
    }

    private String formatReminderType(ReminderType type) {
        if (type == null) {
            return "Recordatorio";
        }
        return switch (type) {
            case VACCINATION -> "Vacunación";
            case DEWORMING -> "Desparasitación";
            case CHECKUP -> "Consulta de control";
            case LAB_TEST -> "Examen de laboratorio";
            case SURGERY_FOLLOWUP -> "Seguimiento post quirúrgico";
            case MEDICATION_REFILL -> "Reposición de medicación";
            case GROOMING -> "Corte y baño";
            case DENTAL_CARE -> "Profilaxis dental";
            case OTHER -> "Recordatorio";
        };
    }

    private String buildAutomaticDetail(String serviceName, String vetName, LocalDate visitDate) {
        List<String> parts = new ArrayList<>();
        if (serviceName != null) {
            parts.add("Servicio aplicado: " + serviceName);
        }
        if (vetName != null && !vetName.isBlank()) {
            parts.add("Profesional: " + vetName);
        }
        if (visitDate != null) {
            parts.add("Fecha de aplicación: " + visitDate);
        }
        return parts.isEmpty() ? null : String.join(" • ", parts);
    }
}
