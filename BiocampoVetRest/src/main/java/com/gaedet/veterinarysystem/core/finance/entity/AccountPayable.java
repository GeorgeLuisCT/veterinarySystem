package com.gaedet.veterinarysystem.core.finance.entity;

import com.gaedet.veterinarysystem.core.finance.enums.AccountPayableStatus;
import com.gaedet.veterinarysystem.core.inventory.entity.Supplier;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "accounts_payable")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountPayable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @Column(nullable = false, length = 250)
    private String description;

    @Column(name = "issue_date", nullable = false)
    private LocalDateTime issueDateTime;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "amount_paid", nullable = false, precision = 14, scale = 2)
    private BigDecimal amountPaid;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountPayableStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "accountPayable", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("paymentDateTime DESC")
    private List<AccountPayablePayment> payments = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (amountPaid == null) {
            amountPaid = BigDecimal.ZERO;
        }
        if (status == null) {
            status = AccountPayableStatus.PENDING;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
