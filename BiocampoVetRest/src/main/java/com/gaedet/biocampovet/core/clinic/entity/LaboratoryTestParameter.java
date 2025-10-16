package com.gaedet.biocampovet.core.clinic.entity;
import com.gaedet.biocampovet.core.animal.entity.AnimalSpecies;
import com.gaedet.biocampovet.core.animal.enums.AnimalSex;
import lombok.*;

import javax.persistence.*;

@Entity
@Table(name = "laboratory_test_parameters")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LaboratoryTestParameter {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private LaboratoryTest test;

    @Column(nullable = false, length = 80)
    private String name;           // p.ej. Hematocrito, Hemoglobina, Leucocitos

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LabValueType valueType; // NUMERIC / TEXT / BOOLEAN / SELECT

    @Column(length = 32)
    private String unit;           // %, g/dL, x10^3/µL, U/L, mg/dL, etc.

    // Para SELECT puedes guardar las opciones permitidas (separadas por coma)
    @Column(length = 400)
    private String allowedOptions; // p.ej. "Negativo,Traza,1+,2+,3+" (solo si valueType=SELECT)

    // Rango(s) de referencia básicos (numéricos)
    private Double refMin;
    private Double refMax;

    @Column(length = 200)
    private String refText;        // si el rango no es numérico o quieres anotar “6.0–17.0”

    // Afinamiento opcional por especie/sexo/edad (si lo necesitas ahora o luego)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "species_id")
    private AnimalSpecies species; // nullable; aplica a todos si es null

    @Enumerated(EnumType.STRING)
    @Column(length = 8)
    private AnimalSex sex;               // nullable

    private Integer ageMinMonths;  // nullable
    private Integer ageMaxMonths;  // nullable

    // Cantidad de decimales a reportar (para UI/validación)
    private Integer decimals;
}

