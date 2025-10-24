package com.gaedet.biocampovet.core.fieltd.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.openapitools.jackson.nullable.JsonNullable;

import javax.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
public class UpdateFieldVisitReportRequest {
    @NotNull
    private Long version;
    private JsonNullable<String> findings = JsonNullable.undefined();
    private JsonNullable<String> diagnoses = JsonNullable.undefined();
    private JsonNullable<String> recommendations = JsonNullable.undefined();
}
