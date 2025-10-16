package com.gaedet.biocampovet.core.branches.repository;

import com.gaedet.biocampovet.core.branches.entity.Laboratory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LaboratoryRepository extends JpaRepository<Laboratory, Long> {

    @EntityGraph(attributePaths = {"branch"})
    Optional<Laboratory> findWithBranchById(Long id);
}
