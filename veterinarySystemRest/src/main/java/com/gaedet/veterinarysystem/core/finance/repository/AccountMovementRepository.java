package com.gaedet.veterinarysystem.core.finance.repository;

import com.gaedet.veterinarysystem.core.finance.entity.AccountMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface AccountMovementRepository extends JpaRepository<AccountMovement, Long> {

    Page<AccountMovement> findByTreasuryAccountIdOrderByMovementDateDesc(Long treasuryAccountId, Pageable pageable);

    boolean existsByTreasuryAccountId(Long treasuryAccountId);

    @Query("select coalesce(sum(m.amount), 0) from AccountMovement m where m.treasuryAccount.id = :treasuryAccountId")
    BigDecimal sumAmountByTreasuryAccountId(@Param("treasuryAccountId") Long treasuryAccountId);
}
