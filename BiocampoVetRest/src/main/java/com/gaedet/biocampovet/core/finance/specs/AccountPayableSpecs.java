package com.gaedet.biocampovet.core.finance.specs;

import com.gaedet.biocampovet.core.finance.entity.AccountPayable;
import com.gaedet.biocampovet.core.finance.enums.AccountPayableStatus;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.JoinType;

public final class AccountPayableSpecs {

    private AccountPayableSpecs() {
    }

    public static Specification<AccountPayable> filter(String search, AccountPayableStatus status, Long supplierId) {
        Specification<AccountPayable> spec = Specification.where(null);

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        if (supplierId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("supplier").get("id"), supplierId));
        }

        if (search != null && !search.isBlank()) {
            String like = "%" + search.trim().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> {
                var supplierJoin = root.join("supplier", JoinType.LEFT);
                return cb.or(
                        cb.like(cb.lower(root.get("description")), like),
                        cb.like(cb.lower(supplierJoin.get("name")), like)
                );
            });
        }

        return spec;
    }
}
