package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    /** Ítems clínicos listos para cobrar (atención lista para facturar y aún sin venta asociada). */
    @Query("""
        select item from ClinicalServiceItem item
        join fetch item.clinicalAttention ca
        join fetch ca.attention att
        join fetch att.animal animal
        join fetch item.clinicalService service
        where item.saleDetailId is null
          and ca.status = com.gaedet.veterinarysystem.core.clinic.enums.ClinicalAttentionStatus.READY_TO_BILL
          and (:branchId is null or att.branch.id = :branchId)
          and (:attentionId is null or att.id = :attentionId)
          and (:patientId is null or animal.id = :patientId)
          and (:q is null or lower(service.name) like lower(concat('%', :q, '%'))
               or lower(animal.name) like lower(concat('%', :q, '%')))
        order by ca.visitDate desc, item.id
    """)
    List<ClinicalServiceItem> findBillable(@Param("branchId") Long branchId,
                                           @Param("attentionId") Long attentionId,
                                           @Param("patientId") Long patientId,
                                           @Param("q") String q);
}
