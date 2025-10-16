package com.gaedet.biocampovet.core.clinic.entity;

import javax.persistence.*;

import com.gaedet.biocampovet.core.animal.entity.Animal;
import com.gaedet.biocampovet.core.clinic.enums.ReminderStatus;
import lombok.*;
import java.time.LocalDate;

/**
 * Entidad para el "Centro de Recordatorios".
 * Se crea automáticamente al aplicar servicios que tienen un período de recordatorio.
 */
@Entity
@Table(name = "reminders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reminder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @Column(nullable = false)
    private String reminderType;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReminderStatus status;
}