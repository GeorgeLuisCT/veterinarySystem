package com.gaedet.veterinarysystem.core.cashbox.entity;

import com.gaedet.veterinarysystem.core.branches.entity.Branch;
import com.gaedet.veterinarysystem.core.cashbox.enums.CashSessionStatus;
import com.gaedet.veterinarysystem.core.sales.entity.SalePayment;
import com.gaedet.veterinarysystem.core.users.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.persistence.Version;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "cash_sessions",
        indexes = {
                @Index(name = "idx_cash_session_branch_status", columnList = "branch_id,status"),
                @Index(name = "idx_cash_session_cashier", columnList = "cashier_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cashier_id", nullable = false)
    private User cashier;

    @Column(name = "opened_at", nullable = false)
    private LocalDateTime openedAt;

    @Column(name = "opening_amount", precision = 14, scale = 2, nullable = false)
    private BigDecimal openingAmount;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "calculated_closing_amount", precision = 14, scale = 2)
    private BigDecimal calculatedClosingAmount;

    @Column(name = "counted_closing_amount", precision = 14, scale = 2)
    private BigDecimal countedClosingAmount;

    @Column(name = "difference_amount", precision = 14, scale = 2)
    private BigDecimal differenceAmount;

    @Column(name = "closing_notes", columnDefinition = "TEXT")
    private String closingNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    @Builder.Default
    private CashSessionStatus status = CashSessionStatus.OPEN;

    @Builder.Default
    @OneToMany(mappedBy = "cashSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CashSessionMovement> movements = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "cashSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SalePayment> salePayments = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (openedAt == null) {
            openedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = CashSessionStatus.OPEN;
        }
    }
}

