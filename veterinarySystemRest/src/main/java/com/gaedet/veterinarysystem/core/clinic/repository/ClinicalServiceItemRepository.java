package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicalServiceItemRepository extends JpaRepository<ClinicalServiceItem, Long> {

    @Query("""
        select distinct item from ClinicalServiceItem item
        join fetch item.clinicalAttention attention
        join fetch attention.attention coreAttention
        join fetch coreAttention.animal animal
        left join fetch animal.owner owner
        join fetch item.clinicalService service
        left join fetch coreAttention.attendingEmployee employee
        left join fetch coreAttention.branch branch
        where service.reminderPeriod is not null
          and service.reminderPeriod > 0
          and service.reminderPeriodUnit is not null
          and attention.visitDate is not null
    """)
    List<ClinicalServiceItem> findAllWithReminder();
}
