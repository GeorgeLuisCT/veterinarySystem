package com.gaedet.veterinarysystem.core.sales.specs;

import com.gaedet.veterinarysystem.core.customer.entity.Customer;
import com.gaedet.veterinarysystem.core.sales.entity.Sale;
import com.gaedet.veterinarysystem.core.sales.enums.SaleStatus;
import com.gaedet.veterinarysystem.core.sales.enums.SalesDocumentType;
import org.springframework.data.jpa.domain.Specification;
import javax.persistence.criteria.Join;
import javax.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SaleSpecs {

    public static Specification<Sale> byFilters(
            String q,
            Long branchId,
            Long customerId,
            Long sellerId,
            SaleStatus status,
            SalesDocumentType documentType,
            String documentNumber,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (branchId != null && branchId > 0) {
                predicates.add(cb.equal(root.get("branch").get("id"), branchId));
            }

            if (customerId != null && customerId > 0) {
                predicates.add(cb.equal(root.get("customer").get("id"), customerId));
            }

            if (sellerId != null && sellerId > 0) {
                predicates.add(cb.equal(root.get("seller").get("id"), sellerId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (documentType != null) {
                predicates.add(cb.equal(root.get("documentType"), documentType));
            }

            if (documentNumber != null && !documentNumber.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("documentNumber")), "%" + documentNumber.toLowerCase().trim() + "%"));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            if (q != null && !q.trim().isEmpty()) {
                String likePattern = "%" + q.toLowerCase().trim() + "%";

                Join<Sale, Customer> customerJoin = root.join("customer", javax.persistence.criteria.JoinType.LEFT);

                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(root.get("documentNumber")), likePattern),
                        cb.like(cb.lower(customerJoin.get("name")), likePattern),
                        cb.like(cb.lower(customerJoin.get("documentNumber")), likePattern)
                );
                predicates.add(searchPredicate);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}