package com.gaedet.biocampovet.core.cash.repository;

import com.gaedet.biocampovet.core.cash.entity.CashboxMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CashboxMovementRepository extends JpaRepository<CashboxMovement, Long> {

}

