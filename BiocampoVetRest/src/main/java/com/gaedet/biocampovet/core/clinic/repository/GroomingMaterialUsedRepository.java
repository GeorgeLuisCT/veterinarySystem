package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.GroomingMaterialUsed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroomingMaterialUsedRepository extends JpaRepository<GroomingMaterialUsed, Long> {
}
