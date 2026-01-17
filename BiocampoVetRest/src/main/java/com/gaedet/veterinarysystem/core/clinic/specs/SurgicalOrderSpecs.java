package com.gaedet.veterinarysystem.core.clinic.specs;

import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalOrder;
import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalOrderStatus;
import org.springframework.data.jpa.domain.Specification;

public final class SurgicalOrderSpecs {

    private SurgicalOrderSpecs() {
    }

    public static Specification<SurgicalOrder> byFilters(
            SurgicalOrderStatus status,
            Long animalId,
            Long branchId,
            Long recommendedServiceId
    ) {
        return (root, cq, cb) -> {
            var predicate = cb.conjunction();

            if (status != null) {
                predicate = cb.and(predicate, cb.equal(root.get("status"), status));
            }

            if (animalId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("animal").get("id"), animalId));
            }

            if (branchId != null) {
                var room = root.join("operatingRoom", javax.persistence.criteria.JoinType.INNER);
                var branch = room.join("branch", javax.persistence.criteria.JoinType.INNER);
                predicate = cb.and(predicate, cb.equal(branch.get("id"), branchId));
            }

            if (recommendedServiceId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("recommendedService").get("id"), recommendedServiceId));
            }

            return predicate;
        };
    }
}
