package com.gaedet.biocampovet.core.cash.entity;

import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cashbox_audit_payment_methods")
@Getter
@Setter
public class CashboxAuditPaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "audit_id", nullable = false)
    private CashboxAudit audit;

    @ManyToOne(optional = false)
    @JoinColumn(name = "payment_method_id", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(nullable = false)
    private BigDecimal expectedAmount;

    @Column(nullable = false)
    private BigDecimal countedAmount;

}
