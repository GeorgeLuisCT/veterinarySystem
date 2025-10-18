package com.gaedet.biocampovet.core.clinic.dto;

import lombok.Getter;
import lombok.Setter;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Getter
@Setter
public class AddEvolutionNoteRequest {
    @NotNull
    private Long authorId;
    @NotBlank
    private String note;
}
