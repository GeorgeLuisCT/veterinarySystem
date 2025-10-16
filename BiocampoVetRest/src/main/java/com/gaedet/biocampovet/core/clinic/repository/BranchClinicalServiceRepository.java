package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.BranchClinicalService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BranchClinicalServiceRepository extends JpaRepository<BranchClinicalService, Long> {
    Optional<BranchClinicalService> findByBranchIdAndClinicalServiceId(Long branchId, Long serviceId);
}
