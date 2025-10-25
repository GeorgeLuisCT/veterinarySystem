package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    @NonNull
    Page<Supplier> findAll(@Nullable Specification<Supplier> spec, @NonNull Pageable pageable);

    @Query(value = """
        SELECT 
            s.id,
            s.name,
            s.email
        FROM suppliers s
        WHERE (:isActive IS NULL OR s.active = :isActive)
          AND (
              :query IS NULL OR
              LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
              LOWER(s.ruc) LIKE LOWER(CONCAT('%', :query, '%')) OR
              LOWER(s.email) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY s.name
        LIMIT 10
        """,
            nativeQuery = true)
    List<Object[]> quickSupplierSearch(
            @Param("query") String query,
            @Param("isActive") Boolean isActive
    );

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);
}