package com.gaedet.biocampovet.core.inventory.specs;

import com.gaedet.biocampovet.core.inventory.entity.Product;
import com.gaedet.biocampovet.core.inventory.entity.ProductBranch;
import com.gaedet.biocampovet.core.inventory.entity.ProductSaleMode;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductPresentationType;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.*;
import java.util.ArrayList;
import java.util.List;

// Specs
public final class ProductSpecs {

    public static Specification<Product> byFilters(
            String q,
            Long categoryId,
            Long branchId,
            Boolean active,
            ProductPresentationType presentation,
            ProductUnitType unitType,
            AdministrationRoute route,
            Boolean hasSaleModes
    ) {
        return Specification
                .where(textSearch(q))
                .and(byCategory(categoryId))
                .and(byPresentation(presentation))
                .and(byUnitType(unitType))
                .and(byRoute(route))
                .and(byHasSaleModes(hasSaleModes))
                .and(byBranchActive(branchId, active))
                .and(distinct());
    }

    private static Specification<Product> distinct() {
        return (root, query, cb) -> {
            query.distinct(true);
            return cb.conjunction();
        };
    }

    private static Specification<Product> textSearch(String q) {
        if (q == null || q.isBlank()) return null;
        String like = "%" + q.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), like),
                cb.like(cb.lower(root.get("sku")), like),
                cb.like(cb.lower(root.get("description")), like)
        );
    }

    private static Specification<Product> byCategory(Long categoryId) {
        if (categoryId == null || categoryId == 0) return null;
        return (root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId);
    }

    private static Specification<Product> byPresentation(ProductPresentationType presentation) {
        if (presentation == null) return null;
        return (root, query, cb) -> cb.equal(root.get("presentation"), presentation);
    }

    private static Specification<Product> byUnitType(ProductUnitType unitType) {
        if (unitType == null) return null;
        return (root, query, cb) -> cb.equal(root.get("unitType"), unitType);
    }

    private static Specification<Product> byRoute(AdministrationRoute route) {
        if (route == null) return null;
        // ElementCollection -> join
        return (root, query, cb) -> {
            Join<Product, AdministrationRoute> routes = root.join("administrationRoutes", JoinType.LEFT);
            return cb.equal(routes, route);
        };
    }

    private static Specification<Product> byHasSaleModes(Boolean hasSaleModes) {
        if (hasSaleModes == null) return null;
        return (root, query, cb) -> {
            Subquery<Long> sq = query.subquery(Long.class);
            Root<Product> p2 = sq.from(Product.class);
            Join<Product, ProductSaleMode> sm = p2.join("saleModes", JoinType.LEFT);
            sq.select(p2.get("id")).where(cb.equal(p2.get("id"), root.get("id")), cb.isNotNull(sm.get("id")));
            if (hasSaleModes) {
                return cb.exists(sq);
            } else {
                return cb.not(cb.exists(sq));
            }
        };
    }

    private static Specification<Product> byBranchActive(Long branchId, Boolean active) {
        if (branchId == null && active == null) return null;

        return (root, query, cb) -> {
            Join<Product, ProductBranch> pbs = root.join("branchStocks", JoinType.LEFT);

            List<Predicate> preds = new ArrayList<>();
            if (branchId != null && branchId != 0) {
                preds.add(cb.equal(pbs.get("branch").get("id"), branchId));
            }
            if (active != null) {
                preds.add(cb.equal(pbs.get("isActive"), active));
            }

            return cb.and(preds.toArray(new Predicate[0]));
        };
    }
}
