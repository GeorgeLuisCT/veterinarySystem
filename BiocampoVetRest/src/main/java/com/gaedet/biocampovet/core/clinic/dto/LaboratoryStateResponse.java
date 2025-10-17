package com.gaedet.biocampovet.core.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LaboratoryStateResponse {
    private Long laboratoryId;
    private String laboratoryName;
    private boolean active;
}
