package com.gaedet.biocampovet.core.inventory.specs;

import com.gaedet.biocampovet.core.inventory.entity.Supplier;
import com.gaedet.biocampovet.core.inventory.enums.SupplierType;
import org.springframework.data.jpa.domain.Specification;

public class SupplierSpecs {

    public static Specification<Supplier> byFilters(String q, String supplierType, Boolean isActive) {
        return Specification
                .where(textSearch(q))
                .and(bySupplierType(supplierType))
                .and(byActive(isActive))
                .and(distinct());
    }

    private static Specification<Supplier> textSearch(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        String query = "%" + q.trim().toLowerCase() + "%";

        return (root, cq, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), query),
                cb.like(cb.lower(root.get("ruc")), query),
                cb.like(cb.lower(root.get("email")), query)
        );
    }

    private static Specification<Supplier> bySupplierType(String supplierType) {
        if (supplierType == null || supplierType.isBlank()) {
            return null;
        }
        try {
            SupplierType type = SupplierType.valueOf(supplierType.trim().toUpperCase());
            return (root, query, cb) -> cb.equal(root.get("supplierType"), type);
        } catch (IllegalArgumentException e) {
            return (root, query, cb) -> cb.equal(cb.literal(1), 0);
        }
    }

    private static Specification<Supplier> byActive(Boolean isActive) {
        if (isActive == null) {
            return null;
        }
        return (root, query, cb) -> cb.equal(root.get("active"), isActive);
    }

    private static Specification<Supplier> distinct() {
        return (root, query, cb) -> {
            query.distinct(true);
            return null;
        };
    }
}