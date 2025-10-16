package com.gaedet.biocampovet.core.sales.entity;

import com.gaedet.biocampovet.core.cash.entity.Payment;
import lombok.*;

import javax.persistence.*;

@Entity
@Table(name = "sale_payment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Sale sale;

    @ManyToOne(optional = false)
    private Payment payment;

    private String detail;
}
