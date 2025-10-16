package com.gaedet.biocampovet.core.clinic.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthPlanResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String notes;
    private List<HealthPlanServiceItemResponse> serviceItems;
}
