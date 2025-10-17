package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.LaboratoryRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LaboratoryRequestRepository extends JpaRepository<LaboratoryRequest, Long>, JpaSpecificationExecutor<LaboratoryRequest> {

    @Query("SELECT lr FROM LaboratoryRequest lr " +
            "LEFT JOIN FETCH lr.animal " +
            "LEFT JOIN FETCH lr.laboratory " +
            "LEFT JOIN FETCH lr.requestingEmployee " +
            "LEFT JOIN FETCH lr.items item " +
            "LEFT JOIN FETCH item.test " +
            "LEFT JOIN FETCH item.results result " +
            "LEFT JOIN FETCH result.parameter " +
            "WHERE lr.id = :id")
    Optional<LaboratoryRequest> findWithDetailsById(@Param("id") Long id);
}
