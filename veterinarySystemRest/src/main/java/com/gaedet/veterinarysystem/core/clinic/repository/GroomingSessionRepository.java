package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.GroomingSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
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

    @Override
    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee",
            "assignedProfessional",
            "materialsUsed",
            "materialsUsed.product"
    })
    List<GroomingSession> findAll(@Nullable Specification<GroomingSession> spec, Sort sort);


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

    @Query("""
        select distinct gs from GroomingSession gs
        left join fetch gs.attention att
        left join fetch att.attendingEmployee
        left join fetch att.service
        left join fetch gs.assignedProfessional
        where att.animal.id = :animalId
          and (:from is null or gs.startedAt >= :from)
          and (:to is null or (gs.finishedAt is not null and gs.finishedAt <= :to) or gs.startedAt <= :to)
        order by coalesce(gs.startedAt, gs.finishedAt) desc
    """)
    List<GroomingSession> findDetailedByAnimal(
            @Param("animalId") Long animalId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );
}
