package com.gaedet.biocampovet.core.clinic.specs;

import com.gaedet.biocampovet.core.clinic.entity.GroomingSession;
import com.gaedet.biocampovet.core.clinic.enums.GroomingStatus;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.Join;
import javax.persistence.criteria.JoinType;
import javax.persistence.criteria.Path;
import javax.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public final class GroomingSessionSpecs {

    private GroomingSessionSpecs() {
    }

    public static Specification<GroomingSession> byFilters(
            List<GroomingStatus> statuses,
            Long branchId,
            Long animalId,
            Long attentionId,
            Long assignedProfessionalId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        return Specification.where(withStatuses(statuses))
                .and(withBranch(branchId))
                .and(withAnimal(animalId))
                .and(withAttention(attentionId))
                .and(withAssignedProfessional(assignedProfessionalId))
                .and(withDateBetween(startDate, endDate));
    }

    private static Specification<GroomingSession> withStatuses(List<GroomingStatus> statuses) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) {
                return cb.conjunction();
            }
            return root.get("status").in(statuses);
        };
    }

    private static Specification<GroomingSession> withBranch(Long branchId) {
        return (root, query, cb) -> {
            if (branchId == null) return cb.conjunction();
            Join<Object, Object> attention = root.join("attention", JoinType.LEFT);
            Join<Object, Object> branch = attention.join("branch", JoinType.LEFT);
            return cb.equal(branch.get("id"), branchId);
        };
    }

    private static Specification<GroomingSession> withAnimal(Long animalId) {
        return (root, query, cb) -> {
            if (animalId == null) return cb.conjunction();
            Join<Object, Object> attention = root.join("attention", JoinType.LEFT);
            Join<Object, Object> animal = attention.join("animal", JoinType.LEFT);
            return cb.equal(animal.get("id"), animalId);
        };
    }

    private static Specification<GroomingSession> withAttention(Long attentionId) {
        return (root, query, cb) -> {
            if (attentionId == null) return cb.conjunction();
            Join<Object, Object> attention = root.join("attention", JoinType.LEFT);
            return cb.equal(attention.get("id"), attentionId);
        };
    }

    private static Specification<GroomingSession> withAssignedProfessional(Long employeeId) {
        return (root, query, cb) -> {
            if (employeeId == null) return cb.conjunction();
            Join<Object, Object> emp = root.join("assignedProfessional", JoinType.LEFT);
            return cb.equal(emp.get("id"), employeeId);
        };
    }

    private static Specification<GroomingSession> withDateBetween(LocalDate startDate, LocalDate endDate) {
        return (root, query, cb) -> {
            if (startDate == null && endDate == null) {
                return cb.conjunction();
            }
            Path<LocalDateTime> startAt = root.get("startedAt");
            Path<LocalDateTime> endAt = root.get("finishedAt");
            List<Predicate> predicates = new ArrayList<>();
            if (startDate != null) {
                LocalDateTime start = startDate.atStartOfDay();
                predicates.add(cb.or(cb.isNull(endAt), cb.greaterThanOrEqualTo(endAt, start)));
            }
            if (endDate != null) {
                LocalDateTime endExclusive = endDate.plusDays(1).atStartOfDay();
                predicates.add(cb.lessThan(startAt, endExclusive));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
