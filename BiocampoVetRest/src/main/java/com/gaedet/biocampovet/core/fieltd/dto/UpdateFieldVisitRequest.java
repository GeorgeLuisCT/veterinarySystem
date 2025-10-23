package com.gaedet.biocampovet.core.fieltd.dto;

import com.gaedet.biocampovet.core.fieltd.enums.FieldVisitStatus;
import lombok.*;
import lombok.experimental.SuperBuilder;

import javax.validation.constraints.*;

@Getter @Setter @NoArgsConstructor @SuperBuilder
public class UpdateFieldVisitRequest extends CreateFieldVisitRequest {
    @NotNull private FieldVisitStatus status;
    private Integer routeOrder;
}

