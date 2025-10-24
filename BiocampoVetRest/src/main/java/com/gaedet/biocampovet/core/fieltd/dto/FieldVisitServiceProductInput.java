package com.gaedet.biocampovet.core.fieltd.dto;

import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitServiceProductInput {

    @NotNull
    private Long productId;

    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal dose;

    @NotNull
    private ProductUnitType unit;

    @NotNull
    private AdministrationRoute administrationRoute;
}
