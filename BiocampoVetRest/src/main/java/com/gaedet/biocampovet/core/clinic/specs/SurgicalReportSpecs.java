package com.gaedet.biocampovet.core.clinic.specs;

import com.gaedet.biocampovet.core.clinic.entity.SurgicalReport;
import com.gaedet.biocampovet.core.clinic.enums.SurgicalReportStatus;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.Join;
import javax.persistence.criteria.JoinType;
import javax.persistence.criteria.Path;
import javax.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public final class SurgicalReportSpecs {

    private SurgicalReportSpecs() {
    }

    public static Specification<SurgicalReport> byAnimalAndSurgeryRange(
            Long animalId, LocalDateTime from, LocalDateTime to) {

        return (root, cq, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.equal(root.get("attention").get("animal").get("id"), animalId));

            if (from != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("surgeryStartAt"), from));
            }
            if (to != null) {
                p.add(cb.lessThanOrEqualTo(root.get("surgeryStartAt"), to));
            }

            cq.distinct(true);
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    public static Specification<SurgicalReport> byFilters(
            List<SurgicalReportStatus> statuses,
            Long branchId,
            Long animalId,
            Long attentionId,
            Long surgeonId,
            Long operatingRoomId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        return Specification.where(withStatuses(statuses))
                .and(withBranch(branchId))
                .and(withAnimal(animalId))
                .and(withAttention(attentionId))
                .and(withSurgeon(surgeonId))
                .and(withOperatingRoom(operatingRoomId))
                .and(withSurgeryDateBetween(startDate, endDate));
    }

    private static Specification<SurgicalReport> withStatuses(List<SurgicalReportStatus> statuses) {
        return (root, query, cb) -> {
            if (statuses == null || statuses.isEmpty()) {
                return cb.conjunction();
            }
            return root.get("status").in(statuses);
        };
    }

    private static Specification<SurgicalReport> withBranch(Long branchId) {
        return (root, query, cb) -> {
            if (branchId == null) {
                return cb.conjunction();
            }
            Join<Object, Object> attention = root.join("attention", JoinType.LEFT);
            Join<Object, Object> branch = attention.join("branch", JoinType.LEFT);
            return cb.equal(branch.get("id"), branchId);
        };
    }

    private static Specification<SurgicalReport> withAnimal(Long animalId) {
        return (root, query, cb) -> {
            if (animalId == null) {
                return cb.conjunction();
            }
            Join<Object, Object> attention = root.join("attention", JoinType.LEFT);
            Join<Object, Object> animal = attention.join("animal", JoinType.LEFT);
            return cb.equal(animal.get("id"), animalId);
        };
    }

    private static Specification<SurgicalReport> withAttention(Long attentionId) {
        return (root, query, cb) -> {
            if (attentionId == null) {
                return cb.conjunction();
            }
            Join<Object, Object> attention = root.join("attention", JoinType.LEFT);
            return cb.equal(attention.get("id"), attentionId);
        };
    }

    private static Specification<SurgicalReport> withSurgeon(Long surgeonId) {
        return (root, query, cb) -> {
            if (surgeonId == null) {
                return cb.conjunction();
            }
            Join<Object, Object> surgeon = root.join("surgeon", JoinType.LEFT);
            return cb.equal(surgeon.get("id"), surgeonId);
        };
    }

    private static Specification<SurgicalReport> withOperatingRoom(Long operatingRoomId) {
        return (root, query, cb) -> {
            if (operatingRoomId == null) {
                return cb.conjunction();
            }
            Join<Object, Object> room = root.join("operatingRoom", JoinType.LEFT);
            return cb.equal(room.get("id"), operatingRoomId);
        };
    }

    private static Specification<SurgicalReport> withSurgeryDateBetween(LocalDate startDate, LocalDate endDate) {
        return (root, query, cb) -> {
            if (startDate == null && endDate == null) {
                return cb.conjunction();
            }

            Path<LocalDateTime> startAt = root.get("surgeryStartAt");
            Path<LocalDateTime> endAt   = root.get("surgeryEndAt");

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
