package com.gaedet.biocampovet.core.cash.entity;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import com.gaedet.biocampovet.core.cash.enums.CashBoxStatus;
import com.gaedet.biocampovet.core.users.entity.User;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "cashboxes")
@Getter
@Setter
public class Cashbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne
    private User openedBy;

    @ManyToOne
    private User closedBy;

    private BigDecimal initialAmount;

    private LocalDateTime openedAt;
    private LocalDateTime closedAt;

    @Enumerated(EnumType.STRING)
    private CashBoxStatus status;

    private BigDecimal totalIncome;
    private BigDecimal totalExpense;

    private BigDecimal physicalAmount;

    private String closingObservations;

    @OneToMany(mappedBy = "cashbox")
    private List<Payment> payments;

    @OneToMany(mappedBy = "cashbox")
    private List<CashboxMovement> cashboxMovements;

    @OneToMany(mappedBy = "cashbox", cascade = CascadeType.ALL)
    private List<CashboxAudit> audits;
}

