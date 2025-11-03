package com.gaedet.biocampovet.core.payments.repository;

import com.gaedet.biocampovet.core.payments.entity.CashSessionMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CashSessionMovementRepository extends JpaRepository<CashSessionMovement, Long> {

    List<CashSessionMovement> findByCashSessionId(Long cashSessionId);
}

