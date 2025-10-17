package com.gaedet.biocampovet.core.clinic.specs;

import com.gaedet.biocampovet.core.clinic.entity.LaboratoryTest;
import com.gaedet.biocampovet.core.clinic.entity.LaboratoryTestLaboratory;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.Join;
import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class LaboratoryTestSpecs {

    public static Specification<LaboratoryTest> byFilters(String q, Long laboratoryId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (q != null && !q.trim().isEmpty()) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("code")), pattern)
                ));
            }

            if (laboratoryId != null && laboratoryId > 0) {
                Join<LaboratoryTest, LaboratoryTestLaboratory> join = root.join("laboratoryLinks");
                predicates.add(cb.equal(join.get("laboratory").get("id"), laboratoryId));
                predicates.add(cb.isTrue(join.get("isActive")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}