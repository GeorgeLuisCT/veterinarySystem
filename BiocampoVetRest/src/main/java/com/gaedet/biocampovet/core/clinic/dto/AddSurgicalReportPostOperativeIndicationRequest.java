package com.gaedet.biocampovet.core.clinic.dto;

import com.gaedet.biocampovet.core.clinic.enums.FrequencyUnit;
import com.gaedet.biocampovet.core.inventory.enums.AdministrationRoute;
import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.validation.constraints.AssertTrue;
import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddSurgicalReportPostOperativeIndicationRequest {

    private Long productId;
    private BigDecimal doseAmount;
    private ProductUnitType doseUnit;
    private Integer frequencyValue;
    private FrequencyUnit frequencyUnit;
    private AdministrationRoute route;
    private String nonDrugInstruction;

    @AssertTrue(message = "Debe especificar un producto con dosis o una instrucción no farmacológica, pero no ambos.")
    public boolean isValidIndication() {
        boolean hasProduct = productId != null;
        boolean hasInstruction = nonDrugInstruction != null && !nonDrugInstruction.trim().isEmpty();

        if (hasProduct && hasInstruction) {
            return false;
        }

        if (!hasProduct && !hasInstruction) {
            return false;
        }

        if (hasProduct) {
            return doseAmount != null && doseUnit != null;
        }

        return true;
    }
}
