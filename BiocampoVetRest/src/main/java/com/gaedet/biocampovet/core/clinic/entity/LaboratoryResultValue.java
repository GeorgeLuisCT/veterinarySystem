package com.gaedet.biocampovet.core.clinic.entity;

import lombok.*;
import javax.persistence.*;
import javax.validation.constraints.AssertTrue;

@Entity
@Table(name = "laboratory_result_values",
        uniqueConstraints = @UniqueConstraint(columnNames = {"request_item_id","parameter_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LaboratoryResultValue {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "request_item_id", nullable = false)
    private LaboratoryRequestItem requestItem;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "parameter_id", nullable = false)
    private LaboratoryTestParameter parameter;

    // Los tres campos siguientes permiten cubrir NUMERIC / TEXT / BOOLEAN / SELECT.
    private Double numericValue;      // si valueType=NUMERIC
    @Column(length = 400)
    private String textValue;         // si TEXT o SELECT (guarda la opción elegida)
    private Boolean booleanValue;     // si BOOLEAN

    // Permite sobreescribir unidad si el labo reporta distinto (raro, pero útil)
    @Column(length = 32)
    private String unitOverride;

    // Marcadores de interpretación
    private Boolean outOfRange;       // calculado vs refMin/refMax
    @Column(length = 120)
    private String flag;              // p.ej. "ALTO", "BAJO", "CRÍTICO"
    @Column(columnDefinition = "TEXT")
    private String comment;

    @AssertTrue(message = "El valor no coincide con el tipo del parámetro")
    public boolean isValueMatchesType() {
        if (parameter == null || parameter.getValueType() == null) return false;

        boolean hasNumeric  = numericValue  != null;
        boolean hasText     = (textValue != null && !textValue.isBlank());
        boolean hasBoolean  = booleanValue != null;

        int count = (hasNumeric ? 1 : 0) + (hasText ? 1 : 0) + (hasBoolean ? 1 : 0);
        if (count != 1) return false;

        return switch (parameter.getValueType()) {
            case NUMERIC -> hasNumeric;
            case TEXT    -> hasText;
            case SELECT  -> hasText;    // SELECT va en textValue
            case BOOLEAN -> hasBoolean;
        };
    }
// observaciones del analista
}
