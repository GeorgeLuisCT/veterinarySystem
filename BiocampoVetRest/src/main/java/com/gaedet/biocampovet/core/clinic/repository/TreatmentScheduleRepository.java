package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.TreatmentSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TreatmentScheduleRepository extends JpaRepository<TreatmentSchedule, Long> {
}
