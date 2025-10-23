package com.gaedet.biocampovet.core.fieltd.specs;

import com.gaedet.biocampovet.core.fieltd.entity.FieldVisit;
import com.gaedet.biocampovet.core.fieltd.enums.FieldVisitStatus;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.JoinType;
import java.time.LocalDateTime;

public class FieldVisitSpecs {
    public static Specification<FieldVisit> byFilters(String q, FieldVisitStatus status, Long vetId, Long farmId, Long zoneId, Long vehicleId, LocalDateTime from, LocalDateTime to) {
        return (root, cq, cb) -> {
            var p = cb.conjunction();
            var farmJoin = root.join("farm", JoinType.LEFT);
            var farmZoneJoin = farmJoin.join("zone", JoinType.LEFT);
            var zoneJoin = root.join("zone", JoinType.LEFT);
            if (q != null && !q.isBlank()) {
                var like = "%" + q.trim().toLowerCase() + "%";
                var objectiveLike = cb.like(cb.lower(cb.coalesce(root.get("objective"), "")), like);
                var farmNameLike = cb.like(cb.lower(cb.coalesce(farmJoin.get("name"), "")), like);
                var zoneNameLike = cb.like(cb.lower(cb.coalesce(zoneJoin.get("name"), "")), like);
                var farmZoneNameLike = cb.like(cb.lower(cb.coalesce(farmZoneJoin.get("name"), "")), like);
                p = cb.and(p, cb.or(objectiveLike, farmNameLike, zoneNameLike, farmZoneNameLike));
            }
            if (status != null) {
                p = cb.and(p, cb.equal(root.get("status"), status));
            }
            if (vetId != null && vetId > 0) {
                p = cb.and(p, cb.equal(root.get("fieldVet").get("id"), vetId));
            }
            if (farmId != null && farmId > 0) {
                p = cb.and(p, cb.equal(farmJoin.get("id"), farmId));
            }
            if (zoneId != null && zoneId > 0) {
                p = cb.and(p, cb.or(
                        cb.equal(zoneJoin.get("id"), zoneId),
                        cb.equal(farmZoneJoin.get("id"), zoneId)
                ));
            }
            if (vehicleId != null && vehicleId > 0) {
                p = cb.and(p, cb.equal(root.get("vehicle").get("id"), vehicleId));
            }
            if (from != null) {
                p = cb.and(p, cb.greaterThanOrEqualTo(root.get("scheduledDateTime"), from));
            }
            if (to != null) {
                p = cb.and(p, cb.lessThanOrEqualTo(root.get("scheduledDateTime"), to));
            }
            return p;
        };
    }
}
