package com.gaedet.veterinarysystem.core.clinic.specs;

import com.gaedet.veterinarysystem.core.clinic.entity.HealthPlan;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.JoinType;

public class HealthPlanSpecs {

    private HealthPlanSpecs() {
    }

    public static Specification<HealthPlan> byFilters(String q) {
        return (root, cq, cb) -> {
            var predicate = cb.conjunction();

            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                var namePredicate = cb.like(cb.lower(root.get("name")), like);
                var descriptionPredicate = cb.like(cb.lower(cb.coalesce(root.get("description"), "")), like);

                var itemsJoin = root.join("serviceItems", JoinType.LEFT);
                var serviceName = cb.lower(cb.coalesce(itemsJoin.join("clinicalService", JoinType.LEFT).get("name"), ""));

                predicate = cb.and(predicate, cb.or(
                        namePredicate,
                        descriptionPredicate,
                        cb.like(serviceName, like)
                ));
                cq.distinct(true);
            }

            return predicate;
        };
    }
}
