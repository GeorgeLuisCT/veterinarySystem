package com.gaedet.biocampovet.core.inventory.specs;


import com.gaedet.biocampovet.core.inventory.entity.KardexMovement;
import org.springframework.data.jpa.domain.Specification;
import javax.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public final class KardexSpecifications {

    private KardexSpecifications() {}

    public static Specification<KardexMovement> kardexHistory(
            Long productId, Long branchId, Long batchId,
            LocalDate startDate, LocalDate endDate
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("product").get("id"), productId));

            if (branchId != null && branchId > 0) {
                predicates.add(cb.equal(root.get("branch").get("id"), branchId));
            }

            if (batchId != null) {
                predicates.add(cb.equal(root.get("batch").get("id"), batchId));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), startDate.atStartOfDay()));
            }

            if (endDate != null) {
                predicates.add(cb.lessThan(root.get("date"), endDate.plusDays(1).atStartOfDay()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
