package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.Cage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CageRepository extends JpaRepository<Cage, Long>, JpaSpecificationExecutor<Cage> {
}
