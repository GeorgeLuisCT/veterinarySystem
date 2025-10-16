package com.gaedet.biocampovet.core.cash.entity;
import lombok.*;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "payment_methods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(name = "percentage_extra", precision = 5, scale = 2)
    private BigDecimal percentageExtra;

    @Column(name = "percentage_discount", precision = 5, scale = 2)
    private BigDecimal percentageDiscount;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}