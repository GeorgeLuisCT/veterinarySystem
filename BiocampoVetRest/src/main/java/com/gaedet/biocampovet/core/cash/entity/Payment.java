package com.gaedet.biocampovet.core.cash.entity;

import com.gaedet.biocampovet.core.cash.enums.PaymentType;
import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentType type;

    @ManyToOne(optional = false)
    private Cashbox cashbox;

    @ManyToOne(optional = false)
    private PaymentMethod paymentMethod;

    private BigDecimal amount;

    private String description;
    private String operationNumber;
    private String documentReference;
    private String receivedBy;

    private LocalDateTime paidAt;

    private String notes;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        if (paidAt == null) {
            paidAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

