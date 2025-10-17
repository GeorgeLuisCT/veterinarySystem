package com.gaedet.biocampovet.core.clinic.entity;

import com.gaedet.biocampovet.core.branches.entity.Laboratory;
import lombok.*;
import javax.persistence.*;

@Entity
@Table(
        name = "laboratory_test_laboratories",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_test_lab",
                columnNames = {"laboratory_test_id", "laboratory_id"}
        )
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LaboratoryTestLaboratory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "laboratory_test_id", nullable = false)
    private LaboratoryTest laboratoryTest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "laboratory_id", nullable = false)
    private Laboratory laboratory;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
