package com.gaedet.veterinarysystem.core.cashbox.specs;

import com.gaedet.veterinarysystem.core.cashbox.entity.CashSession;
import com.gaedet.veterinarysystem.core.cashbox.enums.CashSessionStatus;
import org.springframework.data.jpa.domain.Specification;
import javax.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class CashSessionSpecs {

    public static Specification<CashSession> byFilters(
            Long branchId,
            Long cashierId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("status"), CashSessionStatus.CLOSED));

            if (branchId != null && branchId > 0) {
                predicates.add(cb.equal(root.get("branch").get("id"), branchId));
            }

            if (cashierId != null && cashierId > 0) {
                predicates.add(cb.equal(root.get("cashier").get("id"), cashierId));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("openedAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("openedAt"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}