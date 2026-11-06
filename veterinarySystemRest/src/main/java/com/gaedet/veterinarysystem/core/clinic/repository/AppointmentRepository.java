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

    /** Citas vigentes (no canceladas/completadas/ausentes) en una ventana de tiempo, para detectar cruces. */
    @org.springframework.data.jpa.repository.Query("""
        select a from Appointment a
        left join a.surgicalDetail sd
        where a.status not in (
                com.gaedet.veterinarysystem.core.clinic.enums.AppointmentStatus.CANCELED,
                com.gaedet.veterinarysystem.core.clinic.enums.AppointmentStatus.COMPLETED,
                com.gaedet.veterinarysystem.core.clinic.enums.AppointmentStatus.NO_SHOW)
          and a.startDateTime >= :from and a.startDateTime < :to
          and ((:employeeId is not null and a.assignedEmployee.id = :employeeId)
            or (:animalId is not null and a.animal.id = :animalId)
            or (:roomId is not null and sd.operatingRoom.id = :roomId))
    """)
    List<Appointment> findActiveCandidates(
            @org.springframework.data.repository.query.Param("employeeId") Long employeeId,
            @org.springframework.data.repository.query.Param("animalId") Long animalId,
            @org.springframework.data.repository.query.Param("roomId") Long roomId,
            @org.springframework.data.repository.query.Param("from") java.time.LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") java.time.LocalDateTime to);
}
