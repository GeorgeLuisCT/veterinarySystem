package com.gaedet.veterinarysystem.core.clinic.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplateSummaryResponse {
    private Long id;
    private String name;
    private String purpose;
    private int medicationCount;
}
