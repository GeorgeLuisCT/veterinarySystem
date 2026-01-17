package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.PrescriptionTemplate;
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
public interface PrescriptionTemplateRepository extends
        JpaRepository<PrescriptionTemplate, Long>,
        JpaSpecificationExecutor<PrescriptionTemplate> {

    boolean existsByNameIgnoreCase(String name);
    Optional<PrescriptionTemplate> findByNameIgnoreCase(String name);

    @Override
    @EntityGraph(attributePaths = {"medications", "medications.product"}, type = EntityGraph.EntityGraphType.LOAD)
    Page<PrescriptionTemplate> findAll(@Nullable Specification<PrescriptionTemplate> spec,
                                       @NonNull Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"medications", "medications.product"}, type = EntityGraph.EntityGraphType.LOAD)
    @NonNull
    Optional<PrescriptionTemplate> findById(@NonNull Long id);

    @Query(value = """
        SELECT
            pt.id,
            pt.name,
            pt.purpose,
            LEFT(COALESCE(pt.notes, ''), 120) AS notes_snippet,
            COUNT(DISTINCT ptm.id) AS medications_count
        FROM prescription_templates pt
        LEFT JOIN prescription_template_medications ptm
            ON ptm.prescription_template_id = pt.id
        LEFT JOIN products p
            ON p.id = ptm.product_id
        WHERE (
            :query IS NULL OR
            pt.name ILIKE CONCAT('%', :query, '%') OR
            pt.purpose ILIKE CONCAT('%', :query, '%') OR
            pt.notes ILIKE CONCAT('%', :query, '%') OR
            ptm.custom_medication_name ILIKE CONCAT('%', :query, '%') OR
            p.name ILIKE CONCAT('%', :query, '%')
        )
        GROUP BY pt.id, pt.name, pt.purpose, pt.notes
        ORDER BY pt.name ASC
        LIMIT 10
        """, nativeQuery = true)
    List<Object[]> quickTemplateSearch(@Param("query") String query);
}
