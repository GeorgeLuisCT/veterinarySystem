package com.gaedet.biocampovet.core.cash.repository;

import com.gaedet.biocampovet.core.cash.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    boolean existsByNameIgnoreCase(String name);

    List<PaymentMethod> findAllByIsActiveTrue();
}