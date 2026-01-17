package com.gaedet.veterinarysystem.core.fieltd.specs;

import com.gaedet.veterinarysystem.core.fieltd.entity.Farm;
import org.springframework.data.jpa.domain.Specification;

public class FarmSpecs {
    public static Specification<Farm> byFilters(String q, Long customerId, Long zoneId) {
        return (root, cq, cb) -> {
            var p = cb.conjunction();
            if (q != null && !q.isBlank()) {
                var like = "%" + q.trim().toLowerCase() + "%";
                p = cb.and(p, cb.like(cb.lower(root.get("name")), like));
            }
            if (customerId != null && customerId > 0) {
                p = cb.and(p, cb.equal(root.get("customer").get("id"), customerId));
            }
            if (zoneId != null && zoneId > 0) {
                p = cb.and(p, cb.equal(root.get("zone").get("id"), zoneId));
            }
            return p;
        };
    }
}

