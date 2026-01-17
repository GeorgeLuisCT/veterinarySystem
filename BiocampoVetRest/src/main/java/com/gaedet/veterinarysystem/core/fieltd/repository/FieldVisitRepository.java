package com.gaedet.veterinarysystem.core.fieltd.repository;

import com.gaedet.veterinarysystem.core.fieltd.entity.FieldVisit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FieldVisitRepository extends JpaRepository<FieldVisit, Long>, JpaSpecificationExecutor<FieldVisit> {

    @Override
    @EntityGraph(attributePaths = {"farm", "farm.zone", "zone", "fieldVet", "vehicle", "companions", "companions.employee"}, type = EntityGraph.EntityGraphType.LOAD)
    Page<FieldVisit> findAll(@Nullable Specification<FieldVisit> spec, @NonNull Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {
            "farm",
            "farm.zone",
            "zone",
            "fieldVet",
            "vehicle",
            "companions",
            "companions.employee",
            "serviceItems",
            "serviceItems.clinicalService",
            "serviceItems.animals",
            "serviceItems.animals.animal",
            "serviceItems.groups",
            "serviceItems.products",
            "serviceItems.products.product",
            "productUsages",
            "productUsages.product",
            "attachments",
            "biosecurity",
            "report"
    }, type = EntityGraph.EntityGraphType.LOAD)
    @NonNull
    Optional<FieldVisit> findById(@NonNull Long id);

    List<FieldVisit> findByScheduledDateTimeBetween(LocalDateTime from, LocalDateTime to);
}
