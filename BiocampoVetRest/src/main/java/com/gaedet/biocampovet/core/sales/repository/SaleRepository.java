package com.gaedet.biocampovet.core.sales.repository;

import com.gaedet.biocampovet.core.sales.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {
    List<Sale> findByBranchId(Long branchId);
    List<Sale> findByEmployeeId(Long employeeId);
    List<Sale> findByCustomerId(Long customerId);

    @Query("""
    SELECT s FROM Sale s
    LEFT JOIN FETCH s.saleProducts sp 
    LEFT JOIN FETCH sp.product p 
    LEFT JOIN FETCH p.category 
    LEFT JOIN FETCH p.branchStocks
    LEFT JOIN FETCH p.saleModes
    LEFT JOIN FETCH sp.animal
    
    LEFT JOIN FETCH s.salePayments spay 
    LEFT JOIN FETCH spay.payment pay
    LEFT JOIN FETCH pay.paymentMethod pm 
    
    LEFT JOIN FETCH s.branch b
    LEFT JOIN FETCH b.company 
    LEFT JOIN FETCH s.employee emp 
    LEFT JOIN FETCH emp.employeeBranches
    LEFT JOIN FETCH s.customer c 
    LEFT JOIN FETCH c.documentType
    WHERE s.id = :id
    """)
    Optional<Sale> findDetailedById(@Param("id") Long id);

    @Query(value = """
    SELECT
        s.id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_full_name,
        c.name AS customer_name,
        s.sale_date,
        COALESCE((SELECT SUM(sp.subtotal) FROM sale_product sp WHERE sp.sale_id = s.id), 0) AS total_products,
        (
            COALESCE((SELECT SUM(sp.subtotal) FROM sale_product sp WHERE sp.sale_id = s.id), 0)
        ) AS total_amount,
        COALESCE((SELECT SUM(p.amount)
                  FROM sale_payment sp
                  JOIN payments p ON p.id = sp.payment_id
                  WHERE sp.sale_id = s.id), 0) AS total_paid,
        s.status
    FROM sale s
    JOIN employees e ON s.employee_id = e.id
    LEFT JOIN customer c ON s.customer_id = c.id
    WHERE (:branchId IS NULL OR s.branch_id = :branchId)
      AND s.sale_date >= :startDate
      AND s.sale_date <= :endDate
    ORDER BY s.sale_date DESC
    """,
            countQuery = """
    SELECT COUNT(*)
    FROM sale s
    JOIN employees e ON s.employee_id = e.id
    LEFT JOIN customer c ON s.customer_id = c.id
    WHERE (:branchId IS NULL OR s.branch_id = :branchId)
      AND s.sale_date >= :startDate
      AND s.sale_date <= :endDate
    """,
            nativeQuery = true
    )
    Page<Object[]> findSaleSummaryByBranchAndDate(
            @Param("branchId") Long branchId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
