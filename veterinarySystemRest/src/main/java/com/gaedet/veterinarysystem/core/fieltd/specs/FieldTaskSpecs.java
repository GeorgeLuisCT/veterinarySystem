package com.gaedet.veterinarysystem.core.fieltd.specs;

import com.gaedet.veterinarysystem.core.fieltd.entity.FieldTask;
import com.gaedet.veterinarysystem.core.fieltd.enums.FieldTaskPriority;
import com.gaedet.veterinarysystem.core.fieltd.enums.FieldTaskStatus;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.JoinType;
import java.time.LocalDateTime;

public class FieldTaskSpecs {
    public static Specification<FieldTask> byFilters(String q, FieldTaskStatus status, FieldTaskPriority priority,
                                                    Long assignedToId, Long farmId, Long zoneId,
                                                    LocalDateTime dueFrom, LocalDateTime dueTo) {
        return (root, cq, cb) -> {
            var p = cb.conjunction();
            var zoneJoin = root.join("zone", JoinType.LEFT);
            var farmJoin = root.join("farm", JoinType.LEFT);
            if (q != null && !q.isBlank()) {
                var like = "%" + q.trim().toLowerCase() + "%";
                p = cb.and(p, cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("description"), "")), like)
                ));
            }
            if (status != null) p = cb.and(p, cb.equal(root.get("status"), status));
            if (priority != null) p = cb.and(p, cb.equal(root.get("priority"), priority));
            if (assignedToId != null && assignedToId > 0) p = cb.and(p, cb.equal(root.get("assignedTo").get("id"), assignedToId));
            if (farmId != null && farmId > 0) p = cb.and(p, cb.equal(farmJoin.get("id"), farmId));
            if (zoneId != null && zoneId > 0) {
                p = cb.and(p, cb.or(
                        cb.equal(zoneJoin.get("id"), zoneId),
                        cb.equal(farmJoin.get("zone").get("id"), zoneId)
                ));
            }
            if (dueFrom != null) p = cb.and(p, cb.greaterThanOrEqualTo(root.get("dueAt"), dueFrom));
            if (dueTo != null) p = cb.and(p, cb.lessThanOrEqualTo(root.get("dueAt"), dueTo));
            return p;
        };
    }
}
