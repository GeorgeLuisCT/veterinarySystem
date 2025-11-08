package com.gaedet.biocampovet.core.finance.repository;

import com.gaedet.biocampovet.core.finance.entity.AccountPayablePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountPayablePaymentRepository extends JpaRepository<AccountPayablePayment, Long> {
    List<AccountPayablePayment> findByAccountPayableIdOrderByPaymentDateDesc(Long accountPayableId);
}
