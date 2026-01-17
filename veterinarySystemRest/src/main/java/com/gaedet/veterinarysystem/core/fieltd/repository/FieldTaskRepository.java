package com.gaedet.veterinarysystem.core.fieltd.repository;

import com.gaedet.veterinarysystem.core.fieltd.entity.FieldTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

@Repository
public interface FieldTaskRepository extends JpaRepository<FieldTask, Long>, JpaSpecificationExecutor<FieldTask> {
    @Override
    @EntityGraph(attributePaths = {"farm", "assignedTo", "createdBy"}, type = EntityGraph.EntityGraphType.LOAD)
    Page<FieldTask> findAll(@Nullable Specification<FieldTask> spec, @NonNull Pageable pageable);
}

