package com.gaedet.veterinarysystem.core.employees.specs;

import com.gaedet.veterinarysystem.core.employees.entity.Employee;
import com.gaedet.veterinarysystem.core.employees.entity.EmployeeBranch;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.*;
import java.util.ArrayList;
import java.util.List;

public final class EmployeeSpecs {

    private EmployeeSpecs() {}

    public static Specification<Employee> byFilters(
            String q,
            Long branchId,
            Boolean active
    ) {
        return Specification
                .where(textSearch(q))
                .and(byBranchActive(branchId, active))
                .and(distinct());
    }

    private static Specification<Employee> distinct() {
        return (root, query, cb) -> {
            query.distinct(true);
            return cb.conjunction();
        };
    }

    private static Specification<Employee> textSearch(String q) {
        if (q == null || q.isBlank()) return null;
        String like = "%" + q.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("firstName")), like),
                cb.like(cb.lower(root.get("lastName")), like),
                cb.like(cb.lower(root.get("email")), like),
                cb.like(cb.lower(root.get("phoneNumber")), like)
        );
    }

    private static Specification<Employee> byBranchActive(Long branchId, Boolean active) {
        if ((branchId == null || branchId == 0) && active == null) return null;

        return (root, query, cb) -> {
            SetJoin<Employee, EmployeeBranch> eb = root.joinSet("employeeBranches", JoinType.LEFT);

            List<Predicate> preds = new ArrayList<>();

            if (branchId != null && branchId != 0) {
                preds.add(cb.equal(eb.get("branch").get("id"), branchId));
            }
            if (active != null) {
                preds.add(cb.equal(eb.get("active"), active));
            }

            return cb.and(preds.toArray(new Predicate[0]));
        };
    }
}

