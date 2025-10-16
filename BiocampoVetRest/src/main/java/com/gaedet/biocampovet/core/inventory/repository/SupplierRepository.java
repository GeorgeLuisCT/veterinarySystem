package com.gaedet.biocampovet.core.inventory.repository;

import com.gaedet.biocampovet.core.inventory.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    @Query(value = """
        SELECT 
            s.id,
            s.name,
            s.ruc,
            s.phone,
            s.email,
            s.supplier_type,
            s.active
        FROM suppliers s
        WHERE (:supplierType IS NULL OR s.supplier_type = :supplierType)
          AND (:isActive IS NULL OR s.active = :isActive)
          AND (
              :query IS NULL OR
              LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
              LOWER(s.ruc) LIKE LOWER(CONCAT('%', :query, '%')) OR
              LOWER(s.email) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY s.name
        """,
            countQuery = """
        SELECT COUNT(*) FROM suppliers s
        WHERE (:supplierType IS NULL OR s.supplier_type = :supplierType)
          AND (:isActive IS NULL OR s.active = :isActive)
          AND (
              :query IS NULL OR
              LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
              LOWER(s.ruc) LIKE LOWER(CONCAT('%', :query, '%')) OR
              LOWER(s.email) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        """,
            nativeQuery = true)
    Page<Object[]> findSupplierSummary(
            @Param("query") String query,
            @Param("supplierType") String supplierType,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );

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

    Optional<Supplier> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);
}