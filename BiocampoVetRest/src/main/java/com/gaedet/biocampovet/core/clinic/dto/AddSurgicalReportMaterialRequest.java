package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.AssertTrue;
import javax.validation.constraints.NotNull;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddSurgicalReportMaterialRequest {

    private Long productId;
    private String unregisteredProductName;

    @NotNull(message = "La cantidad es obligatoria.")
    private Integer quantity;

    @NotNull(message = "El tipo de unidad es obligatorio.")
    private ProductUnitType unitType;

    @AssertTrue(message = "Debe especificarse un productId o un unregisteredProductName, pero no ambos.")
    public boolean isSourceValid() {
        boolean hasProduct = productId != null;
        boolean hasName = unregisteredProductName != null && !unregisteredProductName.trim().isEmpty();
        return hasProduct ^ hasName;
    }
}
