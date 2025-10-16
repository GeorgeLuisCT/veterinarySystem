package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.PrescriptionTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

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
}
