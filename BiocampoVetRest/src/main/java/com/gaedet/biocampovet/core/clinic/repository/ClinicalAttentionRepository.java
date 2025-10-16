package com.gaedet.biocampovet.core.clinic.repository;

import com.gaedet.biocampovet.core.clinic.entity.ClinicalAttention;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicalAttentionRepository extends
        JpaRepository<ClinicalAttention, Long>,
        JpaSpecificationExecutor<ClinicalAttention> {

    @Override
    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee"
    })
    Page<ClinicalAttention> findAll(@Nullable org.springframework.data.jpa.domain.Specification<ClinicalAttention> spec,
                                    Pageable pageable);

    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee"
    })
    java.util.List<ClinicalAttention> findAll(@Nullable org.springframework.data.jpa.domain.Specification<ClinicalAttention> spec,
                                              org.springframework.data.domain.Sort sort);

    @EntityGraph(attributePaths = {
            "attention",
            "attention.animal",
            "attention.branch",
            "attention.attendingEmployee",
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
    Optional<ClinicalAttention> findByAttentionId(@Param("attentionId") Long attentionId);}
