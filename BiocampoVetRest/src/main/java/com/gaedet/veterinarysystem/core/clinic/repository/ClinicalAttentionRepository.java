package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.dto.history.ClinicalHistoryLatestAttentionProjection;
import com.gaedet.veterinarysystem.core.clinic.entity.ClinicalAttention;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;
import java.util.List;

@Repository
public interface ClinicalAttentionRepository extends
        JpaRepository<ClinicalAttention, Long>,
        JpaSpecificationExecutor<ClinicalAttention> {

    @Override
    @EntityGraph(attributePaths = {
            "attention",
            "attention.service",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee"
    })
    Page<ClinicalAttention> findAll(@Nullable Specification<ClinicalAttention> spec,
                                    Pageable pageable);

    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee"
    })
    List<ClinicalAttention> findAll(@Nullable Specification<ClinicalAttention> spec,
                                    Sort sort);

    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee",
            "attention.service",
            "attention.appointment",
            "attention.surgicalOrder",
            "medicationAdministrations",
            "medicationAdministrations.product",
            "medicationAdministrations.administeredBy",
            "serviceItems",
            "serviceItems.clinicalService",
            "surgicalOrders",
            "surgicalOrders.recommendedService",
            "surgicalOrders.requestedBy",
            "laboratoryRequests",
            "laboratoryRequests.laboratory",
            "laboratoryRequests.requestingEmployee",
            "laboratoryRequests.items"
    })
    Optional<ClinicalAttention> findWithDetailsById(Long id);

    @Query("SELECT ca FROM ClinicalAttention ca " +
            "LEFT JOIN FETCH ca.attention a " +
            "LEFT JOIN FETCH a.animal " +
            "LEFT JOIN FETCH a.branch " +
            "LEFT JOIN FETCH ca.medicationAdministrations " +
            "LEFT JOIN FETCH ca.serviceItems " +
            "LEFT JOIN FETCH ca.surgicalOrders " +
            "LEFT JOIN FETCH ca.laboratoryRequests " +
            "WHERE ca.attention.id = :attentionId")
    Optional<ClinicalAttention> findWithDetailsByAttentionId(@Param("attentionId") Long attentionId);

    boolean existsByAttention_Id(Long attentionId);

    @Query("select ca from ClinicalAttention ca where ca.attention.id = :attentionId")
    Optional<ClinicalAttention> findByAttentionId(@Param("attentionId") Long attentionId);


    @Query("""
        select distinct ca from ClinicalAttention ca
        left join fetch ca.serviceItems items
        left join fetch items.clinicalService
        where ca in :attentions
    """)
    List<ClinicalAttention> loadServiceItemsFor(@Param("attentions") List<ClinicalAttention> attentions);

    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee",
            "attention.service"
    })
    List<ClinicalAttention> findByIdIn(Set<Long> ids);

    @Query("""
        select ca.attention.animal.id as animalId,
               ca.id as clinicalAttentionId,
               ca.visitDate as visitDate
        from ClinicalAttention ca
        where ca.attention.animal.id in :animalIds
          and ca.visitDate = (
              select max(innerCa.visitDate)
              from ClinicalAttention innerCa
              where innerCa.attention.animal.id = ca.attention.animal.id
          )
    """)
    List<ClinicalHistoryLatestAttentionProjection> findLatestByAnimalIds(
            @Param("animalIds") Set<Long> animalIds
    );

    @Query("""
        select ca.attention.animal.id, count(ca)
        from ClinicalAttention ca
        where ca.attention.animal.id in :animalIds
        group by ca.attention.animal.id
    """)
    List<Object[]> countByAnimalIds(@Param("animalIds") Set<Long> animalIds);
}