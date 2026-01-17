package com.gaedet.veterinarysystem.core.finance.repository;

import com.gaedet.veterinarysystem.core.finance.entity.TreasuryAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TreasuryAccountRepository extends JpaRepository<TreasuryAccount, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    List<TreasuryAccount> findAllByActiveTrueOrderByNameAsc();
}
