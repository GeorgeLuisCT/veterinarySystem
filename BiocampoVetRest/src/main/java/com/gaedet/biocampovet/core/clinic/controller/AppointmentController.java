package com.gaedet.biocampovet.core.clinic.controller;

import com.gaedet.biocampovet.core.clinic.dto.AppointmentDetailResponse;
import com.gaedet.biocampovet.core.clinic.dto.AppointmentSummaryResponse;
import com.gaedet.biocampovet.core.clinic.dto.AssignAppointmentEmployeeRequest;
import com.gaedet.biocampovet.core.clinic.dto.CreateClinicalAppointmentRequest;
import com.gaedet.biocampovet.core.clinic.dto.CreateGroomingAppointmentRequest;
import com.gaedet.biocampovet.core.clinic.dto.CreateSurgicalAppointmentRequest;
import com.gaedet.biocampovet.core.clinic.dto.RescheduleAppointmentRequest;
import com.gaedet.biocampovet.core.clinic.dto.UpdateAppointmentStatusRequest;
import com.gaedet.biocampovet.core.clinic.enums.AppointmentStatus;
import com.gaedet.biocampovet.core.clinic.enums.AppointmentType;
import com.gaedet.biocampovet.core.clinic.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Validated
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<List<AppointmentSummaryResponse>> list(
            @RequestParam(required = false) AppointmentType type,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long assignedEmployeeId
    ) {
        List<AppointmentSummaryResponse> content = appointmentService.list(type, status, startDate, endDate, assignedEmployeeId);
        return ResponseEntity.ok(content);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDetailResponse> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getDetail(id));
    }

    @PostMapping("/clinical")
    public ResponseEntity<AppointmentDetailResponse> createClinical(
            @Valid @RequestBody CreateClinicalAppointmentRequest request
    ) {
        return ResponseEntity.ok(appointmentService.createClinicalAppointment(request));
    }

    @PostMapping("/grooming")
    public ResponseEntity<AppointmentDetailResponse> createGrooming(
            @Valid @RequestBody CreateGroomingAppointmentRequest request
    ) {
        return ResponseEntity.ok(appointmentService.createGroomingAppointment(request));
    }

    @PostMapping("/surgical")
    public ResponseEntity<AppointmentDetailResponse> createSurgical(
            @Valid @RequestBody CreateSurgicalAppointmentRequest request
    ) {
        return ResponseEntity.ok(appointmentService.createSurgicalAppointment(request));
    }

    @PatchMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentDetailResponse> reschedule(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleAppointmentRequest request
    ) {
        return ResponseEntity.ok(appointmentService.reschedule(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentDetailResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request
    ) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, request));
    }

    @PatchMapping("/{id}/assign-employee")
    public ResponseEntity<AppointmentDetailResponse> assignEmployee(
            @PathVariable Long id,
            @Valid @RequestBody AssignAppointmentEmployeeRequest request
    ) {
        return ResponseEntity.ok(appointmentService.assignEmployee(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        appointmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
