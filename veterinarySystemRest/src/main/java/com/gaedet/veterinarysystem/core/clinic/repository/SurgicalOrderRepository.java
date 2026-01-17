package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.SurgicalOrder;
import com.gaedet.veterinarysystem.core.clinic.enums.SurgicalOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurgicalOrderRepository extends
        JpaRepository<SurgicalOrder, Long>,
        JpaSpecificationExecutor<SurgicalOrder> {

    @Override
    @NonNull
    @EntityGraph(attributePaths = {
            "animal",
            "recommendedService",
            "requestedBy",
            "operatingRoom",
            "operatingRoom.branch",
            "scheduledDetail",
            "scheduledDetail.appointment"
    })
    Page<SurgicalOrder> findAll(@Nullable org.springframework.data.jpa.domain.Specification<SurgicalOrder> spec,
                                @NonNull Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {
            "animal",
            "recommendedService",
            "requestedBy",
            "operatingRoom",
            "operatingRoom.branch",
            "scheduledDetail",
            "scheduledDetail.appointment"
    })
    @NonNull
    Optional<SurgicalOrder> findById(@NonNull Long id);

    @EntityGraph(attributePaths = {
            "animal",
            "recommendedService",
            "requestedBy",
            "operatingRoom",
            "operatingRoom.branch",
            "scheduledDetail",
            "scheduledDetail.appointment"
    })
    List<SurgicalOrder> findByAnimal_IdAndStatus(Long animalId, SurgicalOrderStatus status);
}
