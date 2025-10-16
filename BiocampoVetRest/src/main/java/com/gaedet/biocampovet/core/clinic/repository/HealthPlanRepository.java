package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.HealthPlan;
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
public interface HealthPlanRepository extends
        JpaRepository<HealthPlan, Long>,
        JpaSpecificationExecutor<HealthPlan> {

    boolean existsByNameIgnoreCase(String name);
    Optional<HealthPlan> findByNameIgnoreCase(String name);

    @Override
    @EntityGraph(attributePaths = {"serviceItems", "serviceItems.clinicalService"}, type = EntityGraph.EntityGraphType.LOAD)
    Page<HealthPlan> findAll(@Nullable Specification<HealthPlan> spec,
                             @NonNull Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"serviceItems", "serviceItems.clinicalService"}, type = EntityGraph.EntityGraphType.LOAD)
    @NonNull
    Optional<HealthPlan> findById(@NonNull Long id);
}
