package com.gaedet.biocampovet.core.sales.repository;

import com.gaedet.biocampovet.core.sales.entity.Sale;
import com.gaedet.biocampovet.core.sales.enums.SaleStatus;
import com.gaedet.biocampovet.core.sales.enums.SalesDocumentType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long>, JpaSpecificationExecutor<Sale> {

    Optional<Sale> findByDocumentTypeAndDocumentNumber(SalesDocumentType documentType, String documentNumber);

    @EntityGraph(attributePaths = {"customer", "branch", "seller"})
    List<Sale> findByBranchIdAndStatus(Long branchId, SaleStatus status);

    @EntityGraph(attributePaths = {"customer", "branch", "seller"})
    List<Sale> findByStatus(SaleStatus status);

    long countByBranchIdAndCreatedAtBetween(Long branchId, LocalDateTime start, LocalDateTime end);
}
