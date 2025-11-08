package com.gaedet.biocampovet.core.sales.repository;

import com.gaedet.biocampovet.core.sales.entity.SalePayment;
import com.gaedet.biocampovet.core.sales.enums.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SalePaymentRepository extends JpaRepository<SalePayment, Long> {

    List<SalePayment> findBySaleId(Long saleId);

    @Query("""
            SELECT sp.paymentMethod, SUM(sp.amountPaid)
            FROM SalePayment sp
            WHERE sp.cashSession.id = :cashSessionId
            GROUP BY sp.paymentMethod
            """)
    List<Object[]> sumByCashSessionGrouped(@Param("cashSessionId") Long cashSessionId);

    @Query("""
            SELECT SUM(sp.amountPaid)
            FROM SalePayment sp
            WHERE sp.paymentMethod = :method
              AND sp.paidAt BETWEEN :start AND :end
            """)
    java.math.BigDecimal sumByMethodBetweenDates(
            @Param("method") PaymentMethod method,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    List<SalePayment> findByCashSessionId(Long cashSessionId);
}
