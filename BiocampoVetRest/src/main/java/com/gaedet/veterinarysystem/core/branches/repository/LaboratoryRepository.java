package com.gaedet.veterinarysystem.core.branches.repository;

import com.gaedet.veterinarysystem.core.branches.entity.Laboratory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LaboratoryRepository extends JpaRepository<Laboratory, Long> {

    @EntityGraph(attributePaths = {"branch"})
    Optional<Laboratory> findWithBranchById(Long id);

    @NonNull
    List<Laboratory> findByBranchId(Long branchId);
}
