package com.gaedet.biocampovet.core.fieltd.specs;

import com.gaedet.biocampovet.core.fieltd.entity.GeoZone;
import com.gaedet.biocampovet.core.fieltd.enums.GeoZoneType;
import org.springframework.data.jpa.domain.Specification;

public class GeoZoneSpecs {
    public static Specification<GeoZone> byFilters(String q, GeoZoneType type, Long parentId, Boolean active) {
        return (root, cq, cb) -> {
            var p = cb.conjunction();
            if (q != null && !q.isBlank()) {
                var like = "%" + q.trim().toLowerCase() + "%";
                p = cb.and(p, cb.like(cb.lower(root.get("name")), like));
            }
            if (type != null) {
                p = cb.and(p, cb.equal(root.get("type"), type));
            }
            if (parentId != null && parentId > 0) {
                p = cb.and(p, cb.equal(root.get("parent").get("id"), parentId));
            }
            if (active != null) {
                p = cb.and(p, cb.equal(root.get("active"), active));
            }
            return p;
        };
    }
}

