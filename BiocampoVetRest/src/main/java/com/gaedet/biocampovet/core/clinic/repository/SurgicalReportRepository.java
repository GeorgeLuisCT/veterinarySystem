package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.SurgicalReport;
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
public interface SurgicalReportRepository extends JpaRepository<SurgicalReport, Long>, JpaSpecificationExecutor<SurgicalReport> {

    @Override
    @EntityGraph(attributePaths = {
            "attention",
            "attention.service",
            "attention.animal",
            "attention.branch",
            "surgeon",
            "anesthesiologist",
            "assistant",
            "operatingRoom"
    })
    Page<SurgicalReport> findAll(@Nullable Specification<SurgicalReport> spec, Pageable pageable);

    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee",
            "surgeon",
            "anesthesiologist",
            "assistant",
            "operatingRoom",
            "anestheticProtocol",
            "anestheticProtocol.product",
            "materialsUsed",
            "materialsUsed.product",
            "postOperativeIndications",
            "postOperativeIndications.product"
    })
    Optional<SurgicalReport> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee",
            "surgeon",
            "anesthesiologist",
            "assistant",
            "operatingRoom",
            "anestheticProtocol",
            "anestheticProtocol.product",
            "materialsUsed",
            "materialsUsed.product",
            "postOperativeIndications",
            "postOperativeIndications.product"
    })
    Optional<SurgicalReport> findWithDetailsByAttention_Id(Long attentionId);

    Optional<SurgicalReport> findByAttention_Id(Long attentionId);

    boolean existsByAttention_Id(Long attentionId);
}
