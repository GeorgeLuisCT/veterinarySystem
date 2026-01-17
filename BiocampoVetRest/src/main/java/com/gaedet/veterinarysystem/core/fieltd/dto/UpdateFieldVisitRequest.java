package com.gaedet.veterinarysystem.core.fieltd.dto;

import com.gaedet.veterinarysystem.core.fieltd.enums.FieldVisitStatus;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.*;

@Getter @Setter @NoArgsConstructor @SuperBuilder
public class UpdateFieldVisitRequest extends CreateFieldVisitRequest {
    @NotNull private FieldVisitStatus status;
    private Integer routeOrder;
}

