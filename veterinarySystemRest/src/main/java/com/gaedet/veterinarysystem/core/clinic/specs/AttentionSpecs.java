package com.gaedet.veterinarysystem.core.clinic.specs;

import com.gaedet.veterinarysystem.core.clinic.entity.Attentions;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionType;
import com.gaedet.veterinarysystem.core.clinic.enums.AttentionsStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public final class AttentionSpecs {

    private AttentionSpecs() {
    }

    public static Specification<Attentions> byFilters(
            AttentionType type,
            AttentionsStatus status,
            Long branchId,
            Long animalId,
            Boolean emergency,
            Long appointmentId,
            Long clinicalServiceId,
            LocalDateTime from,
            LocalDateTime to
    ) {
        return (root, cq, cb) -> {
            var predicate = cb.conjunction();

            if (type != null) {
                predicate = cb.and(predicate, cb.equal(root.get("type"), type));
            }
            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }
            if (branchId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("branch").get("id"), branchId));
            }
            if (animalId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("animal").get("id"), animalId));
            }
            if (emergency != null) {
                predicate = cb.and(predicate, cb.equal(root.get("isEmergency"), emergency));
            }
            if (appointmentId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("appointment").get("id"), appointmentId));
            }
            if (clinicalServiceId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("service").get("id"), clinicalServiceId));
            }
            if (from != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("checkInTime"), from));
            }
            if (to != null) {
                predicate = cb.and(predicate, cb.lessThan(root.get("checkInTime"), to)); // endDate exclusivo
            }

            return predicate;
        };
    }
}
