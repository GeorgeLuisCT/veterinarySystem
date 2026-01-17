package com.gaedet.veterinarysystem.core.clinic.mapper;

import com.gaedet.veterinarysystem.core.clinic.dto.TreatmentScheduleProductUsageResponse;
import com.gaedet.veterinarysystem.core.clinic.dto.TreatmentScheduleResponse;
import com.gaedet.veterinarysystem.core.clinic.entity.TreatmentSchedule;
import com.gaedet.veterinarysystem.core.clinic.entity.TreatmentScheduleProductUsage;

import java.util.stream.Collectors;

public class TreatmentScheduleMapper {
    public static TreatmentScheduleResponse toResponse(TreatmentSchedule schedule) {
        TreatmentScheduleResponse response = new TreatmentScheduleResponse();
        response.setId(schedule.getId());
        response.setHospitalizationId(schedule.getHospitalization().getId());
        response.setTreatmentName(schedule.getTreatmentName());
        response.setScheduledTime(schedule.getScheduledTime());
        response.setCompleted(schedule.isCompleted());
        response.setCompletedAt(schedule.getCompletedAt());
        response.setNotes(schedule.getNotes());
        if (schedule.getCompletedBy() != null) {
            response.setCompletedByEmployeeId(schedule.getCompletedBy().getId());
            response.setCompletedByEmployeeFullName(
                    schedule.getCompletedBy().getFirstName() + " " + schedule.getCompletedBy().getLastName());
        }
        if (schedule.getProductUsages() != null) {
            response.setProducts(schedule.getProductUsages().stream()
                    .map(TreatmentScheduleMapper::toProductUsageResponse)
                    .collect(Collectors.toList()));
        }
        return response;
    }

    private static TreatmentScheduleProductUsageResponse toProductUsageResponse(TreatmentScheduleProductUsage usage) {
        TreatmentScheduleProductUsageResponse response = new TreatmentScheduleProductUsageResponse();
        response.setId(usage.getId());
        response.setProductId(usage.getProduct() != null ? usage.getProduct().getId() : null);
        response.setProductName(usage.getProduct() != null ? usage.getProduct().getName() : null);
        response.setQuantity(usage.getQuantity());
        response.setUnit(usage.getUnit());
        return response;
    }
}
