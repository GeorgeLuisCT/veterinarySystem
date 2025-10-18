package com.gaedet.biocampovet.core.clinic.mapper;

import com.gaedet.biocampovet.core.clinic.entity.TreatmentSchedule;
import com.gaedet.biocampovet.core.clinic.dto.TreatmentScheduleResponse;

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
            response.setCompletedByEmployeeFullName(schedule.getCompletedBy().getFirstName() +  " " + schedule.getCompletedBy().getLastName());
        }
        return response;
    }
}
