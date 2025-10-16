package com.gaedet.biocampovet.core.cash.entity;

import com.gaedet.biocampovet.core.users.entity.User;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cashbox_audits")
@Getter
@Setter
public class CashboxAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Cashbox cashbox;

    private BigDecimal difference;

    private boolean isFinal;

    private String observations;

    @ManyToOne
    private User auditedBy;

    private LocalDateTime auditedAt;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "audit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CashboxAuditPaymentMethod> paymentMethodAudits = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        if (auditedAt == null) {
            auditedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}


