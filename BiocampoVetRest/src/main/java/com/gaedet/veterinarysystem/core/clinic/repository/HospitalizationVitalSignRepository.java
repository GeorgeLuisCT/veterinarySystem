package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.HospitalizationVitalSign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HospitalizationVitalSignRepository extends JpaRepository<HospitalizationVitalSign, Long> {
    List<HospitalizationVitalSign> findByHospitalizationIdOrderByRecordedAtDesc(Long hospitalizationId);
}
