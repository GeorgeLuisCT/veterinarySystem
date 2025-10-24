package com.gaedet.biocampovet.core.fieltd.repository;

import com.gaedet.biocampovet.core.fieltd.entity.FieldVisitReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FieldVisitReportRepository extends JpaRepository<FieldVisitReport, Long> {
    Optional<FieldVisitReport> findByFieldVisit_Id(Long fieldVisitId);
}
