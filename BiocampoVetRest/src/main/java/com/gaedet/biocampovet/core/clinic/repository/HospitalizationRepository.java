package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.Hospitalization;
import com.gaedet.biocampovet.core.clinic.enums.HospitalizationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface HospitalizationRepository extends JpaRepository<Hospitalization, Long>, JpaSpecificationExecutor<Hospitalization> {

    @Query("select h from Hospitalization h " +
            "where h.cage.id = :cageId and h.status in :active " +
            "order by h.admissionDate desc")
    List<Hospitalization> findActiveByCageIdOrderByAdmissionDesc(
            @Param("cageId") Long cageId,
            @Param("active") Collection<HospitalizationStatus> active
    );
}
