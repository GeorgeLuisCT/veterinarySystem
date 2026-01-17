package com.gaedet.veterinarysystem.core.cashbox.repository;

import com.gaedet.veterinarysystem.core.cashbox.entity.CashSessionMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CashSessionMovementRepository extends JpaRepository<CashSessionMovement, Long> {

    List<CashSessionMovement> findByCashSessionId(Long cashSessionId);
}

