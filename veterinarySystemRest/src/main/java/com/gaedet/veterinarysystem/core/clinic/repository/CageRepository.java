package com.gaedet.veterinarysystem.core.clinic.repository;

import com.gaedet.veterinarysystem.core.clinic.entity.Cage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import javax.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface CageRepository extends JpaRepository<Cage, Long>, JpaSpecificationExecutor<Cage> {

    /** Bloquea la jaula para que dos admisiones simultáneas no la ocupen a la vez. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Cage c WHERE c.id = :id")
    Optional<Cage> findByIdForUpdate(@Param("id") Long id);
}
