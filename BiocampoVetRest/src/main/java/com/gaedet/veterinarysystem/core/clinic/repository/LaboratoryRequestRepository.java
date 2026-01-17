package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface LaboratoryRequestRepository extends JpaRepository<LaboratoryRequest, Long>, JpaSpecificationExecutor<LaboratoryRequest> {

    @Override
    @EntityGraph(attributePaths = {
            "animal",
            "laboratory",
            "requestingEmployee",
            "items",
            "items.test",
            "items.results",
            "items.results.parameter"
    })
    List<LaboratoryRequest> findAll(@Nullable Specification<LaboratoryRequest> spec, Sort sort);


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

    @Query("""
        select lr.animal.id, count(lr)
        from LaboratoryRequest lr
        where lr.animal.id in :animalIds
        group by lr.animal.id
    """)
    List<Object[]> countByAnimalIds(@Param("animalIds") Set<Long> animalIds);
}
