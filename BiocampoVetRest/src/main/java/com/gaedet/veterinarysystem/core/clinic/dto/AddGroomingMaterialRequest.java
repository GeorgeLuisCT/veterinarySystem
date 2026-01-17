package com.gaedet.veterinarysystem.core.clinic.dto;

import com.gaedet.veterinarysystem.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.AssertTrue;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddGroomingMaterialRequest {

    private Long productId;
    private String unregisteredProductName;

    @NotNull
    private BigDecimal quantity;

    @NotNull
    private ProductUnitType unitType;

    private BigDecimal unitPrice;

    @AssertTrue(message = "Debe especificarse un productId o un unregisteredProductName, pero no ambos.")
    public boolean isSourceValid() {
        boolean hasProduct = productId != null;
        boolean hasName = unregisteredProductName != null && !unregisteredProductName.trim().isEmpty();
        return hasProduct ^ hasName;
    }
}
