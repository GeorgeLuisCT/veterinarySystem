package com.gaedet.biocampovet.core.clinic.entity;
import com.gaedet.biocampovet.core.branches.entity.Laboratory;
import lombok.*;

import javax.persistence.*;
import java.util.HashSet;

@Entity
@Table(name = "laboratory_tests",
        uniqueConstraints = @UniqueConstraint(columnNames = {"laboratory_id", "code"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LaboratoryTest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "laboratory_id", nullable = false)
    private Laboratory laboratory; // el “dueño” del catálogo

    @Column(nullable = false, length = 40)
    private String code;           // p.ej. HEMO_COMP, PERF_BIOQ

    @Column(nullable = false, length = 200)
    private String name;           // p.ej. Hemograma Completo

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    // opcional: precio, TAT estimado, etc.
    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<LaboratoryTestParameter> parameters = new HashSet<>();
}
