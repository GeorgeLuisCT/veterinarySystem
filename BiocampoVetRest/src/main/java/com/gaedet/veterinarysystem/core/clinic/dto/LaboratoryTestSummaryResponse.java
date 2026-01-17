package com.gaedet.veterinarysystem.core.clinic.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class LaboratoryTestSummaryResponse {
    private Long id;
    private String code;
    private String name;
    private BigDecimal price;
    private boolean active;
    private List<LaboratoryStateResponse> laboratories;
}
