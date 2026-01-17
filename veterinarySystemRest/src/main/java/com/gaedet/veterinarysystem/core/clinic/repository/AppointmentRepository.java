package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.Appointment;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends
        JpaRepository<Appointment, Long>,
        JpaSpecificationExecutor<Appointment> {

    @Override
    @EntityGraph(attributePaths = {"branch", "animal", "assignedEmployee"})
    @NonNull
    List<Appointment> findAll(@Nullable org.springframework.data.jpa.domain.Specification<Appointment> spec, @NonNull Sort sort);

    @EntityGraph(attributePaths = {
            "animal",
            "assignedEmployee",
            "branch",
            "clinicalDetail",
            "clinicalDetail.clinicalService",
            "clinicalDetail.veterinarian",
            "groomingDetail",
            "groomingDetail.clinicalService",
            "groomingDetail.stylist",
            "surgicalDetail",
            "surgicalDetail.order",
            "surgicalDetail.finalService",
            "surgicalDetail.surgeon",
            "surgicalDetail.anesthetist",
            "surgicalDetail.operatingRoom"
    })
    Optional<Appointment> findWithDetailsById(Long id);
}
