package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.Hospitalization;
import com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface HospitalizationRepository extends JpaRepository<Hospitalization, Long>, JpaSpecificationExecutor<Hospitalization> {

    /** ¿El animal tiene una hospitalización vigente (ni alta ni cancelada)? */
    boolean existsByAnimalIdAndStatusNotIn(Long animalId, java.util.Collection<com.gaedet.veterinarysystem.core.clinic.enums.HospitalizationStatus> statuses);


    @Override
    @EntityGraph(attributePaths = {
            "attention",
            "attention.attendingEmployee",
            "attention.service",
            "clinicalService",
            "treatmentSchedules",
            "treatmentSchedules.completedBy"
    })
    List<Hospitalization> findAll(@Nullable Specification<Hospitalization> spec, Sort sort);


    @Query("select h from Hospitalization h " +
            "where h.cage.id = :cageId and h.status in :active " +
            "order by h.admissionDate desc")
    List<Hospitalization> findActiveByCageIdOrderByAdmissionDesc(
            @Param("cageId") Long cageId,
            @Param("active") Collection<HospitalizationStatus> active
    );

    @Query("""
        select distinct h from Hospitalization h
        left join fetch h.evolutionNotes notes
        left join fetch notes.author
        where h in :hospitalizations
    """)
    List<Hospitalization> loadEvolutionNotesFor(@Param("hospitalizations") List<Hospitalization> hospitalizations);

    @Query("""
        select h.animal.id, count(h)
        from Hospitalization h
        where h.animal.id in :animalIds
        group by h.animal.id
    """)
    List<Object[]> countByAnimalIds(@Param("animalIds") Set<Long> animalIds);
}
