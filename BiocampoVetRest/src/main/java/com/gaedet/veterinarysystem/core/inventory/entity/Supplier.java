package com.gaedet.veterinarysystem.core.inventory.entity;

import com.gaedet.veterinarysystem.core.inventory.enums.SupplierType;
import lombok.*;

import javax.persistence.*;

@Entity
@Table(name = "suppliers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 250)
    private String name;

    private String ruc;

    private String address;

    private String website;

    private String phone;

    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "supplier_type", nullable = false, length = 20)
    private SupplierType supplierType;

    @Column(name = "bank_name", length = 50)
    private String bankName;

    @Column(name = "bank_account_number", length = 30)
    private String bankAccountNumber;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}