package com.gaedet.biocampovet.core.clinic.specs;

import com.gaedet.biocampovet.core.clinic.entity.Reminder;
import com.gaedet.biocampovet.core.clinic.enums.ReminderStatus;
import com.gaedet.biocampovet.core.clinic.enums.ReminderType;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.JoinType;
import java.time.LocalDate;
import java.util.List;

public final class ReminderSpecs {

    private ReminderSpecs() {
    }

    public static Specification<Reminder> withQueryFilters(
            String query,
            List<ReminderType> types,
            List<ReminderStatus> statuses,
            LocalDate dueFrom,
            LocalDate dueTo
    ) {
        Specification<Reminder> spec = Specification.where(null);

        if (query != null && !query.isBlank()) {
            String like = "%" + query.trim().toLowerCase() + "%";
            spec = spec.and((root, cq, cb) -> {
                var animalJoin = root.join("animal", JoinType.LEFT);
                var ownerJoin = animalJoin.join("owner", JoinType.LEFT);
                return cb.or(
                        cb.like(cb.lower(animalJoin.get("name")), like),
                        cb.like(cb.lower(ownerJoin.get("name")), like),
                        cb.like(cb.lower(animalJoin.get("microchipNumber")), like)
                );
            });
        }

        if (types != null && !types.isEmpty()) {
            spec = spec.and((root, cq, cb) -> root.get("reminderType").in(types));
        }

        if (statuses != null && !statuses.isEmpty()) {
            spec = spec.and((root, cq, cb) -> root.get("status").in(statuses));
        }

        if (dueFrom != null) {
            spec = spec.and((root, cq, cb) -> cb.greaterThanOrEqualTo(root.get("dueDate"), dueFrom));
        }

        if (dueTo != null) {
            spec = spec.and((root, cq, cb) -> cb.lessThanOrEqualTo(root.get("dueDate"), dueTo));
        }

        return spec;
    }
}
