package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.AnestheticPhase;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddSurgicalReportAnestheticDrugRequest {

    @NotNull
    private Long productId;

    @NotNull
    private AnestheticPhase phase;

    @NotNull
    private BigDecimal doseAmount;

    @NotNull
    private ProductUnitType doseUnit;

    private AdministrationRoute route;
}
