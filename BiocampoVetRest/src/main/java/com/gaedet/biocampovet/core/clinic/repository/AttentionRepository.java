package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.Attentions;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AttentionRepository extends
        JpaRepository<Attentions, Long>,
        JpaSpecificationExecutor<Attentions> {

    @Override
    @EntityGraph(attributePaths = {
            "appointment",
            "appointment.animal",
            "appointment.branch",
            "appointment.assignedEmployee",
            "branch",
            "animal",
            "attendingEmployee",
            "service"
    })
    Page<Attentions> findAll(@Nullable org.springframework.data.jpa.domain.Specification<Attentions> spec,
                             Pageable pageable);

    @EntityGraph(attributePaths = {
            "appointment",
            "appointment.animal",
            "appointment.branch",
            "appointment.assignedEmployee",
            "branch",
            "animal",
            "attendingEmployee",
            "service"
    })
    Optional<Attentions> findWithDetailsById(Long id);

    Optional<Attentions> findByAppointmentId(Long appointmentId);
}
