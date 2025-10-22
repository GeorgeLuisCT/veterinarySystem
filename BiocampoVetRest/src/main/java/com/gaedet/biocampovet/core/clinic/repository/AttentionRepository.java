package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.Attentions;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AttentionRepository extends
        JpaRepository<Attentions, Long>,
        JpaSpecificationExecutor<Attentions> {

    @Override
    @EntityGraph(attributePaths = {
            "animal",
            "branch",
            "attendingEmployee",
            "service",

            "appointment",
            "appointment.animal",
            "appointment.branch",
            "appointment.assignedEmployee",

            "appointment.clinicalDetail",
            "appointment.groomingDetail",
            "appointment.surgicalDetail",

            "appointment.clinicalDetail.veterinarian",
            "appointment.clinicalDetail.clinicalService",
            "appointment.groomingDetail.stylist",
            "appointment.groomingDetail.clinicalService",
            "appointment.surgicalDetail.surgeon",
            "appointment.surgicalDetail.anesthetist",
            "appointment.surgicalDetail.finalService",
            "appointment.surgicalDetail.operatingRoom",
            "appointment.surgicalDetail.order"
    })
    Page<Attentions> findAll(@Nullable Specification<Attentions> spec, Pageable pageable);

    @Modifying
    @Query("update Attentions a set a.status = 'IN_CONSULTATION' where a.id = :id and a.status = 'WAITING'")
    int promoteWaitingToInConsultation(@Param("id") Long id);

    @Modifying
    @Query("update Attentions a set a.status = 'IN_PROGRESS' where a.id = :id and a.status = 'WAITING'")
    int promoteWaitingToInProgress(@Param("id") Long id);

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
