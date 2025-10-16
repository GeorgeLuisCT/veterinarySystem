package com.gaedet.biocampovet.core.cash.repository;

import com.gaedet.biocampovet.core.cash.entity.CashboxAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CashboxAuditRepository extends JpaRepository<CashboxAudit, Long> {

}