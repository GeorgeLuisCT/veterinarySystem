package com.gaedet.biocampovet.core.cash.entity;

import com.gaedet.biocampovet.core.cash.enums.ChasboxMovementReason;
import com.gaedet.biocampovet.core.cash.enums.CashboxMovementType;
import com.gaedet.biocampovet.core.users.entity.User;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cashbox_movements")
@Getter
@Setter
public class CashboxMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Cashbox cashbox;

    @Enumerated(EnumType.STRING)
    private CashboxMovementType type;

    @Enumerated(EnumType.STRING)
    private ChasboxMovementReason reason;

    @ManyToOne(optional = false)
    @JoinColumn(name = "payment_method_id", nullable = false)
    private PaymentMethod paymentMethod;

    private BigDecimal amount;

    private String description;
    private String documentReference;
    private String operationNumber;
    private String notes;

    private LocalDateTime registeredAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne(optional = false)
    @JoinColumn(name = "registered_by_user_id", nullable = false)
    private User registeredByUser;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        registeredAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

