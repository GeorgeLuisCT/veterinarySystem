package com.gaedet.biocampovet.core.clinic.specs;

import com.gaedet.biocampovet.core.clinic.entity.ClinicalService;
import com.gaedet.biocampovet.core.clinic.enums.ClinicalServiceCategory;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.JoinType;

public class ClinicalServiceSpecs {
    public static Specification<ClinicalService> byFilters(String q, ClinicalServiceCategory category, Long branchIdOrZero) {
        return (root, cq, cb) -> {
            var p = cb.conjunction();
            if (q != null && !q.isBlank()) {
                var like = "%" + q.trim().toLowerCase() + "%";
                var namePredicate = cb.like(cb.lower(root.get("name")), like);
                var descriptionPredicate = cb.like(
                        cb.lower(cb.coalesce(root.get("description"), "")),
                        like
                );
                p = cb.and(p, cb.or(namePredicate, descriptionPredicate));
            }
            if (category != null) {
                p = cb.and(p, cb.equal(root.get("clinicalServiceCategory"), category));
            }
            if (branchIdOrZero != null && branchIdOrZero != 0L) {
                var links = root.join("branchLinks", JoinType.LEFT);
                p = cb.and(p, cb.equal(links.get("branch").get("id"), branchIdOrZero));
                cq.distinct(true);
            }
            return p;
        };
    }
}
