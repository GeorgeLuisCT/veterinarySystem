package com.gaedet.biocampovet.core.clinic.controller;

import com.gaedet.biocampovet.core.clinic.dto.reminder.ReminderCreateRequest;
import com.gaedet.biocampovet.core.clinic.dto.reminder.ReminderListItemResponse;
import com.gaedet.biocampovet.core.clinic.dto.reminder.ReminderQueryFilters;
import com.gaedet.biocampovet.core.clinic.dto.reminder.ReminderUpdateStatusRequest;
import com.gaedet.biocampovet.core.clinic.enums.ReminderStatus;
import com.gaedet.biocampovet.core.clinic.enums.ReminderType;
import com.gaedet.biocampovet.core.clinic.service.ReminderService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
@Validated
public class ReminderController {

    private final ReminderService reminderService;

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','VETERINARIAN','ASSISTANT','RECEPTIONIST')")
    @GetMapping
    public ResponseEntity<PaginatedResponse<ReminderListItemResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) List<ReminderType> types,
            @RequestParam(required = false) List<ReminderStatus> statuses,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueTo,
            @RequestParam(defaultValue = "true") boolean includeManual,
            @RequestParam(defaultValue = "true") boolean includeAutomatic) {
        ReminderQueryFilters filters = ReminderQueryFilters.builder()
                .query(query)
                .types(types)
                .statuses(statuses)
                .dueFrom(dueFrom)
                .dueTo(dueTo)
                .includeManual(includeManual)
                .includeAutomatic(includeAutomatic)
                .build();

        PaginatedResponse<ReminderListItemResponse> response = reminderService.list(filters, page, size);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','VETERINARIAN','ASSISTANT','RECEPTIONIST')")
    @PostMapping
    public ResponseEntity<ReminderListItemResponse> create(@Valid @RequestBody ReminderCreateRequest request) {
        ReminderListItemResponse response = reminderService.create(request);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','VETERINARIAN','ASSISTANT','RECEPTIONIST')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reminderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','VETERINARIAN','ASSISTANT','RECEPTIONIST')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ReminderListItemResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReminderUpdateStatusRequest request) {
        ReminderListItemResponse response = reminderService.updateStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }
}
