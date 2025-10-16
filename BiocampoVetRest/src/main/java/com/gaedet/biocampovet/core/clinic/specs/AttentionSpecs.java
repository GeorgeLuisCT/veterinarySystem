package com.gaedet.biocampovet.core.clinic.specs;

import com.gaedet.biocampovet.core.clinic.entity.Attentions;
import com.gaedet.biocampovet.core.clinic.enums.AttentionType;
import com.gaedet.biocampovet.core.clinic.enums.AttentionsStatus;
import org.springframework.data.jpa.domain.Specification;

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
            Long clinicalServiceId
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

            return predicate;
        };
    }
}
