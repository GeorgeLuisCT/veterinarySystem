package com.gaedet.biocampovet.core.inventory.entity;

import lombok.*;

import javax.persistence.*;

@Entity
@Table(name = "category_product")
@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
@Builder
public class CategoryProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50, unique = true)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
