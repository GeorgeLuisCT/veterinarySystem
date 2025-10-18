package com.gaedet.biocampovet.core.clinic.specs;

import com.gaedet.biocampovet.core.clinic.entity.Hospitalization;
import com.gaedet.biocampovet.core.clinic.enums.HospitalizationStatus;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class HospitalizationSpecification {

    public static Specification<Hospitalization> byFilters(
            Long branchId,
            Long animalId,
            Long cageId,
            List<HospitalizationStatus> statuses,
            LocalDate startDate,
            LocalDate endDate) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (branchId != null) {
                predicates.add(criteriaBuilder.equal(root.get("cage").get("branch").get("id"), branchId));
            }
            if (animalId != null) {
                predicates.add(criteriaBuilder.equal(root.get("animal").get("id"), animalId));
            }
            if (cageId != null) {
                predicates.add(criteriaBuilder.equal(root.get("cage").get("id"), cageId));
            }
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }
            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("admissionDate"), startDate.atStartOfDay()));
            }
            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("admissionDate"), endDate.plusDays(1).atStartOfDay()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
