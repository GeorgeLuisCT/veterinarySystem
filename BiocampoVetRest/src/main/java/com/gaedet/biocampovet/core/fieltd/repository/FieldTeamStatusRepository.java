package com.gaedet.biocampovet.core.fieltd.repository;

import com.gaedet.biocampovet.core.fieltd.entity.FieldTeamStatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FieldTeamStatusRepository extends JpaRepository<FieldTeamStatusEntity, Long> {
    Optional<FieldTeamStatusEntity> findByEmployee_Id(Long employeeId);
}

