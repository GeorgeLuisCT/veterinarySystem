package com.gaedet.biocampovet.core.clinic.specs;

import com.gaedet.biocampovet.core.clinic.entity.Appointment;
import com.gaedet.biocampovet.core.clinic.enums.AppointmentStatus;
import com.gaedet.biocampovet.core.clinic.enums.AppointmentType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public final class AppointmentSpecs {

    private AppointmentSpecs() {
    }

    public static Specification<Appointment> byFilters(
            AppointmentType type,
            AppointmentStatus status,
            LocalDate startDate,
            LocalDate endDate,
            Long assignedEmployeeId
    ) {
        return (root, cq, cb) -> {
            var predicate = cb.conjunction();

            if (type != null) {
                predicate = cb.and(predicate, cb.equal(root.get("type"), type));
            }

            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }

            if (startDate != null) {
                LocalDateTime from = startDate.atStartOfDay();
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("startDateTime"), from));
            }

            if (endDate != null) {
                LocalDateTime to = endDate.atTime(LocalTime.MAX);
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("startDateTime"), to));
            }

            if (assignedEmployeeId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("assignedEmployee").get("id"), assignedEmployeeId));
            }

            return predicate;
        };
    }
}
