package com.gaedet.biocampovet.core.clinic.specs;

import com.gaedet.biocampovet.core.clinic.entity.PrescriptionTemplate;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.JoinType;

public class PrescriptionTemplateSpecs {

    private PrescriptionTemplateSpecs() {
    }

    public static Specification<PrescriptionTemplate> byFilters(String q) {
        return (root, cq, cb) -> {
            var predicate = cb.conjunction();

            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                var namePredicate = cb.like(cb.lower(root.get("name")), like);
                var purposePredicate = cb.like(cb.lower(root.get("purpose")), like);

                var medicationsJoin = root.join("medications", JoinType.LEFT);
                var productName = cb.lower(cb.coalesce(medicationsJoin.join("product", JoinType.LEFT).get("name"), ""));
                var customMedicationName = cb.lower(cb.coalesce(medicationsJoin.get("customMedicationName"), ""));

                predicate = cb.and(predicate, cb.or(
                        namePredicate,
                        purposePredicate,
                        cb.like(productName, like),
                        cb.like(customMedicationName, like)
                ));
                cq.distinct(true);
            }

            return predicate;
        };
    }
}
