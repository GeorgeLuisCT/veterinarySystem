package com.gaedet.biocampovet.core.animal.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.animal.enums.AnimalSex;
import com.gaedet.biocampovet.core.animal.enums.AnimalSpecies;
import com.gaedet.biocampovet.core.customer.entity.Customer;
import lombok.*;

import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "animal")
@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
@Builder
public class Animal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer owner;

    @Column(nullable = false)
    private String name;

    @Column(name = "photo_url", length = 2048)
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "species", nullable = false)
    private AnimalSpecies species;

    @Column(nullable = true)
    private String breed;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "sex")
    private AnimalSex sex;

    @Column(name = "microchip_number", unique = true)
    private String microchipNumber;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "animal_allergies", joinColumns = @JoinColumn(name = "animal_id"))
    @Column(name = "allergy")
    private Set<String> allergies;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "animal_chronic_conditions", joinColumns = @JoinColumn(name = "animal_id"))
    @Column(name = "condition")
    private Set<String> chronicConditions;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;
}