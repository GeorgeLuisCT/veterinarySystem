package com.gaedet.biocampovet.core.clinic.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplateResponse {
    private Long id;
    private String name;
    private String purpose;
    private String notes;
    private List<PrescriptionTemplateMedicationResponse> medications;
}
