package com.gaedet.veterinarysystem.core.sales.repository;

import com.gaedet.veterinarysystem.core.sales.entity.SalePayment;
import com.gaedet.veterinarysystem.core.sales.enums.PaymentMethod;
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
              AND sp.sale.status = com.gaedet.veterinarysystem.core.sales.enums.SaleStatus.COMPLETED
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

    /** Pagos de la sesión que cuentan para la caja: solo ventas COMPLETADAS (no borradores ni anuladas). */
    @Query("""
            SELECT sp FROM SalePayment sp
            WHERE sp.cashSession.id = :cashSessionId
              AND sp.sale.status = com.gaedet.veterinarysystem.core.sales.enums.SaleStatus.COMPLETED
            """)
    List<SalePayment> findCompletedByCashSessionId(@Param("cashSessionId") Long cashSessionId);

    /** Pagos que pertenecen a sesiones ya cerradas (impide anular ventas cuyo dinero ya se transfirió). */
    @Query("""
            SELECT COUNT(sp) FROM SalePayment sp
            WHERE sp.sale.id = :saleId
              AND sp.cashSession.status = com.gaedet.veterinarysystem.core.cashbox.enums.CashSessionStatus.CLOSED
            """)
    long countPaymentsInClosedSessions(@Param("saleId") Long saleId);

    @Query("SELECT p FROM SalePayment p " +
            "JOIN FETCH p.sale s " +
            "LEFT JOIN FETCH s.customer c " +
            "WHERE p.cashSession.id = :cashSessionId " +
            "ORDER BY p.paidAt DESC")
    List<SalePayment> findAllWithDetailsByCashSessionId(@Param("cashSessionId") Long cashSessionId);
}
