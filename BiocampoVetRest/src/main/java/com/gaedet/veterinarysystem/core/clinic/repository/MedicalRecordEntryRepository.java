package com.gaedet.veterinarysystem.core.clinic.repository;


import com.gaedet.veterinarysystem.core.clinic.dto.MedicalRecordSummaryResponse;
import com.gaedet.veterinarysystem.core.clinic.entity.MedicalRecordEntry;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MedicalRecordEntryRepository extends JpaRepository<MedicalRecordEntry, Long> {

    @Query("""
        select new com.gaedet.veterinarysystem.core.clinic.dto.MedicalRecordSummaryResponse(
            e.occurredAt, e.category, e.title
        )
        from MedicalRecordEntry e
        where e.animal.id = :animalId
        order by e.occurredAt desc
    """)
    List<MedicalRecordSummaryResponse> findSummaryByAnimal(
            @Param("animalId") Long animalId,
            Pageable pageable
    );
}