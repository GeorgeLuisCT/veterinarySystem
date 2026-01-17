package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.GroomingAppointmentDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroomingAppointmentDetailRepository extends JpaRepository<GroomingAppointmentDetail, Long> {
}
