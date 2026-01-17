package com.gaedet.veterinarysystem.core.clinic.specs;

import com.gaedet.veterinarysystem.core.clinic.entity.Attentions;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalAttention;
import com.gaedet.veterinarysystem.core.clinic.enums.ClinicalAttentionStatus;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.Join;
import javax.persistence.criteria.JoinType;
import javax.persistence.criteria.Path;
import javax.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

public final class ClinicalAttentionSpecs {

    private ClinicalAttentionSpecs() {
    }

    public static Specification<ClinicalAttention> byAnimalAndVisitRange(
            Long animalId, LocalDateTime from, LocalDateTime to) {

        return (root, cq, cb) -> {
            List<Predicate> p = new ArrayList<>();
            Path<Long> animalIdPath = root.get("attention").get("animal").get("id");
            p.add(cb.equal(animalIdPath, animalId));

            if (from != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("visitDate"), from));
            }
            if (to != null) {
                p.add(cb.lessThanOrEqualTo(root.get("visitDate"), to));
            }

            cq.distinct(true);
            return cb.and(p.toArray(new Predicate[0]));
        };
    }

    public static Specification<ClinicalAttention> byFilters(
            List<ClinicalAttentionStatus> statuses,
            Long branchId,
            Long animalId,
            Long attentionId,
            Long attendingEmployeeId,
            LocalDate startDate,
            LocalDate endDate
    ) {
        return (root, cq, cb) -> {
            var predicate = cb.conjunction();
            Join<ClinicalAttention, Attentions> attentionJoin = root.join("attention", JoinType.LEFT);

            if (statuses != null && !statuses.isEmpty()) {
                predicate = cb.and(predicate, root.get("status").in(statuses));
            }

            if (branchId != null) {
                predicate = cb.and(predicate, cb.equal(attentionJoin.get("branch").get("id"), branchId));
            }

            if (animalId != null) {
                predicate = cb.and(predicate, cb.equal(attentionJoin.get("animal").get("id"), animalId));
            }

            if (attentionId != null) {
                predicate = cb.and(predicate, cb.equal(attentionJoin.get("id"), attentionId));
            }

            if (attendingEmployeeId != null) {
                predicate = cb.and(predicate, cb.equal(attentionJoin.get("attendingEmployee").get("id"), attendingEmployeeId));
            }

            if (startDate != null) {
                LocalDateTime from = startDate.atStartOfDay();
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("visitDate"), from));
            }

            if (endDate != null) {
                LocalDateTime to = endDate.atTime(LocalTime.MAX);
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("visitDate"), to));
            }

            return predicate;
        };
    }

    public static Specification<ClinicalAttention> activeByAttendingEmployee(Long attendingEmployeeId) {
        Set<ClinicalAttentionStatus> activeStatuses = EnumSet.of(
                ClinicalAttentionStatus.OPEN,
                ClinicalAttentionStatus.IN_PROGRESS,
                ClinicalAttentionStatus.WAITING_LAB,
                ClinicalAttentionStatus.READY_TO_BILL
        );

        return (root, cq, cb) -> {
            var predicate = root.get("status").in(activeStatuses);

            if (attendingEmployeeId != null) {
                Join<ClinicalAttention, Attentions> attentionJoin = root.join("attention", JoinType.LEFT);
                predicate = cb.and(predicate,
                        cb.equal(attentionJoin.get("attendingEmployee").get("id"), attendingEmployeeId));
            }

            return predicate;
        };
    }
}
