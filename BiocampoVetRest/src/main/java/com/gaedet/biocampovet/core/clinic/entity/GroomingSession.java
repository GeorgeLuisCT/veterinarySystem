package com.gaedet.biocampovet.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.clinic.enums.GroomingStatus;
import lombok.*;
import java.util.List;

/**
 * Seguimiento detallado del flujo de trabajo de una sesión de peluquería.
 */
@Entity
@Table(name = "grooming_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroomingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attention_id", unique = true, nullable = false)
    private Attentions attention;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroomingStatus status;

    @Column(columnDefinition = "TEXT")
    private String behaviorNotes;

    @Column(columnDefinition = "TEXT")
    private String clinicalObservations;

    @ElementCollection
    @CollectionTable(name = "grooming_photos", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "photo_url")
    private List<String> photoUrls;
}