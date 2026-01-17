package com.gaedet.veterinarysystem.core.clinic.specs;

import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryRequest;
import com.gaedet.veterinarysystem.core.clinic.enums.LabRequestStatus;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class LaboratoryRequestSpecs {

    public static Specification<LaboratoryRequest> byAnimalAndCreatedRange(
            Long animalId, LocalDateTime from, LocalDateTime to) {

        return (root, cq, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.equal(root.get("animal").get("id"), animalId));

            if (from != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                p.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            cq.distinct(true);
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    public static Specification<LaboratoryRequest> byFilters(
            List<LabRequestStatus> statuses,
            Long branchId,
            Long animalId,
            Long laboratoryId,
            Long requestingEmployeeId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }

            if (branchId != null && branchId > 0) {
                predicates.add(cb.equal(root.get("laboratory").get("branch").get("id"), branchId));
            }

            if (animalId != null && animalId > 0) {
                predicates.add(cb.equal(root.get("animal").get("id"), animalId));
            }

            if (laboratoryId != null && laboratoryId > 0) {
                predicates.add(cb.equal(root.get("laboratory").get("id"), laboratoryId));
            }

            if (requestingEmployeeId != null && requestingEmployeeId > 0) {
                predicates.add(cb.equal(root.get("requestingEmployee").get("id"), requestingEmployeeId));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate.atTime(23, 59, 59)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
