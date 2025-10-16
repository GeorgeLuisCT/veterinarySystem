package com.gaedet.biocampovet.core.clinic.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthPlanServiceItemResponse {
    private Long id;
    private Long clinicalServiceId;
    private String clinicalServiceName;
    private Integer quantity;
    private String notes;
}
