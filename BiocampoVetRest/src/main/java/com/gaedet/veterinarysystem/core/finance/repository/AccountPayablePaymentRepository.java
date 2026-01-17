package com.gaedet.veterinarysystem.core.finance.repository;

import com.gaedet.veterinarysystem.core.finance.entity.AccountPayablePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountPayablePaymentRepository extends JpaRepository<AccountPayablePayment, Long> {
    List<AccountPayablePayment> findByAccountPayableIdOrderByPaymentDateTimeDesc(Long accountPayableId);
}
