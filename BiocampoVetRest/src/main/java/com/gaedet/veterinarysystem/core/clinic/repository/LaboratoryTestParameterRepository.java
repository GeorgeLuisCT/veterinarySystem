package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryTestParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LaboratoryTestParameterRepository extends JpaRepository<LaboratoryTestParameter, Long> {
}
