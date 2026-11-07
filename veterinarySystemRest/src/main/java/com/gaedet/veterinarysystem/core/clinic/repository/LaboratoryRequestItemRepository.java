package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.LaboratoryRequestItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public interface LaboratoryRequestItemRepository extends JpaRepository<LaboratoryRequestItem, Long> {

    /** Exámenes solicitados que aún no se cobraron (excluye cancelados). */
    @Query("""
        select item from LaboratoryRequestItem item
        join fetch item.laboratoryRequest req
        join fetch req.animal animal
        join fetch req.laboratory lab
        join fetch item.test test
        left join req.clinicalAttention ca
        left join ca.attention att
        where item.saleDetailId is null
          and item.status <> com.gaedet.veterinarysystem.core.clinic.enums.LabRequestItemStatus.CANCELED
          and req.status <> com.gaedet.veterinarysystem.core.clinic.enums.LabRequestStatus.CANCELED
          and (:branchId is null or lab.branch.id = :branchId)
          and (:attentionId is null or att.id = :attentionId)
          and (:patientId is null or animal.id = :patientId)
          and (:q is null or lower(test.name) like lower(concat('%', :q, '%'))
               or lower(animal.name) like lower(concat('%', :q, '%')))
        order by req.createdAt desc, item.id
    """)
    List<LaboratoryRequestItem> findBillable(@Param("branchId") Long branchId,
                                             @Param("attentionId") Long attentionId,
                                             @Param("patientId") Long patientId,
                                             @Param("q") String q);
}
