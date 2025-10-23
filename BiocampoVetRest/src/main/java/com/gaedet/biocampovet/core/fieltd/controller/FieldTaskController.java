package com.gaedet.biocampovet.core.fieltd.controller;

import com.gaedet.biocampovet.core.fieltd.dto.*;
import com.gaedet.biocampovet.core.fieltd.enums.FieldTaskPriority;
import com.gaedet.biocampovet.core.fieltd.enums.FieldTaskStatus;
import com.gaedet.biocampovet.core.fieltd.service.FieldTaskService;
import com.gaedet.biocampovet.core.global.PaginatedResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/fieldwork/tasks")
@RequiredArgsConstructor
@Validated
public class FieldTaskController {
    private final FieldTaskService fieldTaskService;

    @GetMapping
    public ResponseEntity<PaginatedResponse<FieldTaskSummaryResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) FieldTaskStatus status,
            @RequestParam(required = false) FieldTaskPriority priority,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Long farmId,
            @RequestParam(required = false) Long zoneId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueTo
    ) { return ResponseEntity.ok(fieldTaskService.list(page, size, q, status, priority, assignedToId, farmId, zoneId, dueFrom, dueTo)); }

    @GetMapping("/detail")
    public ResponseEntity<FieldTaskResponse> get(@RequestParam Long id) { return ResponseEntity.ok(fieldTaskService.get(id)); }

    @PostMapping
    public ResponseEntity<List<FieldTaskResponse>> create(@Valid @RequestBody CreateFieldTaskRequest r, @RequestParam(required = false) Long createdById) { return ResponseEntity.ok(fieldTaskService.create(r, createdById)); }

    @PutMapping
    public ResponseEntity<FieldTaskResponse> update(@RequestParam Long id, @Valid @RequestBody UpdateFieldTaskRequest r) { return ResponseEntity.ok(fieldTaskService.update(id, r)); }

    @DeleteMapping
    public ResponseEntity<FieldTaskSummaryResponse> delete(@RequestParam Long id) { return ResponseEntity.ok(fieldTaskService.delete(id)); }

    @PostMapping("/assign")
    public ResponseEntity<FieldVisitSummaryResponse> assign(@RequestParam Long taskId,
                                                            @Valid @RequestBody AssignFieldTaskRequest r,
                                                            @RequestParam(required = false) Long assignedById) {
        return ResponseEntity.ok(fieldTaskService.assign(taskId, r, assignedById));
    }
}
