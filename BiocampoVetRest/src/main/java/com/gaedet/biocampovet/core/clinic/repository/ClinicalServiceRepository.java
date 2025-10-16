package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.ClinicalService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClinicalServiceRepository extends
        JpaRepository<ClinicalService, Long>,
        JpaSpecificationExecutor<ClinicalService> {

    boolean existsByNameIgnoreCase(String name);
    Optional<ClinicalService> findByNameIgnoreCase(String name);

    @Override
    @EntityGraph(attributePaths = {"branchLinks", "branchLinks.branch"}, type = EntityGraph.EntityGraphType.LOAD)
    Page<ClinicalService> findAll(@Nullable Specification<ClinicalService> spec,
                                  @NonNull Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"branchLinks", "branchLinks.branch"}, type = EntityGraph.EntityGraphType.LOAD)
    @NonNull
    Optional<ClinicalService> findById(@NonNull Long id);

    @Query(value = """
            SELECT
                cs.id,
                cs.name,
                cs.clinical_service_category,
                cs.price
            FROM clinical_services cs
            WHERE (:branchId IS NULL OR EXISTS (
                    SELECT 1 FROM branch_clinical_services bcs
                    WHERE bcs.clinical_service_id = cs.id
                      AND bcs.branch_id = :branchId
            ))
            AND (:isActive IS NULL OR EXISTS (
                    SELECT 1 FROM branch_clinical_services bcs2
                    WHERE bcs2.clinical_service_id = cs.id
                      AND bcs2.is_active = :isActive
            ))
            AND (
                :query IS NULL OR
                LOWER(cs.name) LIKE LOWER(CONCAT('%', :query, '%'))
            )
            ORDER BY cs.name
            LIMIT 10
            """,
            nativeQuery = true)
    List<Object[]> quickClinicalServiceSearch(
            @Param("query") String query,
            @Param("branchId") Long branchId,
            @Param("isActive") Boolean isActive
    );
}
