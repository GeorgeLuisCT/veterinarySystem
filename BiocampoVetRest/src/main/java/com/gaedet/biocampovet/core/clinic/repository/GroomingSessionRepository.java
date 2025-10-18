package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.GroomingSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GroomingSessionRepository extends JpaRepository<GroomingSession, Long>, JpaSpecificationExecutor<GroomingSession> {

    @Override
    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "assignedProfessional"
    })
    Page<GroomingSession> findAll(@Nullable Specification<GroomingSession> spec, Pageable pageable);

    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee",
            "assignedProfessional",
            "materialsUsed",
            "materialsUsed.product"
    })
    Optional<GroomingSession> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee",
            "assignedProfessional",
            "materialsUsed",
            "materialsUsed.product"
    })
    Optional<GroomingSession> findWithDetailsByAttention_Id(Long attentionId);

    Optional<GroomingSession> findByAttention_Id(Long attentionId);

    boolean existsByAttention_Id(Long attentionId);
}
