package com.gaedet.veterinarysystem.core.clinic.entity;
import com.gaedet.veterinarysystem.core.animal.enums.AnimalSex;
import com.gaedet.veterinarysystem.core.animal.enums.AnimalSpecies;
import com.gaedet.veterinarysystem.core.clinic.enums.LabUnit;
import com.gaedet.veterinarysystem.core.clinic.enums.LabValueType;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", length = 24, nullable = false) // permite NULL si el parámetro no tiene unidad
    private LabUnit unit;

    // Para SELECT puedes guardar las opciones permitidas (separadas por coma)
    @Column(length = 400)
    private String allowedOptions; // p.ej. "Negativo,Traza,1+,2+,3+" (solo si valueType=SELECT)

    // Rango(s) de referencia básicos (numéricos)
    private Double refMin;
    private Double refMax;

    @Column(length = 200)
    private String refText;        // si el rango no es numérico o quieres anotar “6.0–17.0”

    @Enumerated(EnumType.STRING)
    @Column(name = "species", length = 32)
    private AnimalSpecies species;

    @Enumerated(EnumType.STRING)
    @Column(length = 8)
    private AnimalSex sex;               // nullable

    private Integer ageMinMonths;  // nullable
    private Integer ageMaxMonths;  // nullable

    // Cantidad de decimales a reportar (para UI/validación)
    private Integer decimals;
}

