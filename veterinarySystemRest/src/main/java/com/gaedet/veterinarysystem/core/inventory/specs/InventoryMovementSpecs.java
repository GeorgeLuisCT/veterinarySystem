package com.gaedet.veterinarysystem.core.inventory.specs;

import com.gaedet.veterinarysystem.core.inventory.entity.InventoryMovement;
import com.gaedet.veterinarysystem.core.inventory.enums.InventoryMovementType;

import javax.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class InventoryMovementSpecs {

    public static Specification<InventoryMovement> byFilters(
            Long branchId,
            Collection<InventoryMovementType> types,
            LocalDate startDate,
            LocalDate endDate
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (branchId != null) {
                predicates.add(cb.or(
                        cb.equal(root.get("sourceBranch").get("id"), branchId),
                        cb.equal(root.get("targetBranch").get("id"), branchId)
                ));
            }

            if (types != null && !types.isEmpty()) {
                predicates.add(root.get("type").in(types));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), startDate.atStartOfDay()));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), endDate.atTime(LocalTime.MAX)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}