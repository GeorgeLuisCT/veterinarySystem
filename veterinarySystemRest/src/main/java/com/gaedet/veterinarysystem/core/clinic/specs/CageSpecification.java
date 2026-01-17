package com.gaedet.veterinarysystem.core.clinic.specs;

import com.gaedet.veterinarysystem.core.clinic.entity.Cage;
import com.gaedet.veterinarysystem.core.clinic.enums.CageSize;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class CageSpecification {

    public static Specification<Cage> byFilters(Long branchId, String name, CageSize size, Boolean isOccupied) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (branchId != null) {
                predicates.add(criteriaBuilder.equal(root.get("branch").get("id"), branchId));
            }
            if (name != null && !name.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
            }
            if (size != null) {
                predicates.add(criteriaBuilder.equal(root.get("size"), size));
            }
            if (isOccupied != null) {
                predicates.add(criteriaBuilder.equal(root.get("isOccupied"), isOccupied));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
