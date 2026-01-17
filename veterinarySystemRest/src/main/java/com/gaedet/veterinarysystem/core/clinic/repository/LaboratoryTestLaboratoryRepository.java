package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryTestLaboratory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LaboratoryTestLaboratoryRepository extends JpaRepository<LaboratoryTestLaboratory, Long> {
    Optional<LaboratoryTestLaboratory> findByLaboratoryIdAndLaboratoryTestId(Long laboratoryId, Long testId);
}
