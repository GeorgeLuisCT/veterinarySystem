package com.gaedet.biocampovet.core.clinic.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class EvolutionNoteResponse {
    private Long id;
    private Long hospitalizationId;
    private Long authorId;
    private String authorFullName;
    private LocalDateTime timestamp;
    private String note;
}
