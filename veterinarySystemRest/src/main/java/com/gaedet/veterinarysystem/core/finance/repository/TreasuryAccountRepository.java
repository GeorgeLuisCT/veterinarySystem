package com.gaedet.veterinarysystem.core.finance.repository;

import com.gaedet.veterinarysystem.core.finance.entity.TreasuryAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import javax.persistence.LockModeType;
import java.util.Optional;

@Repository
public interface TreasuryAccountRepository extends JpaRepository<TreasuryAccount, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM TreasuryAccount a WHERE a.id = :id")
    Optional<TreasuryAccount> findByIdForUpdate(@Param("id") Long id);

    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    List<TreasuryAccount> findAllByActiveTrueOrderByNameAsc();
}
