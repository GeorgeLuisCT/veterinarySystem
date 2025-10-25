package com.gaedet.biocampovet.core.inventory.entity;

import com.gaedet.biocampovet.core.branches.entity.Branch;
import lombok.*;

import javax.persistence.*;

@Entity
@Table(
        name = "product_branch_stock",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = { "product_id", "branch_id" })
        }
)
@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
@Builder
public class ProductBranch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = false;
}
