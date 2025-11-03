package com.gaedet.biocampovet.core.sales.dto.request;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import com.gaedet.biocampovet.core.sales.enums.BillableServiceType;
import com.gaedet.biocampovet.core.sales.enums.SaleItemKind;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.AssertTrue;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SaleItemRequest {

    @NotNull
    private SaleItemKind kind;

    private Long productId;

    private Long productBatchId;

    private Long saleModeId;

    private BillableServiceType serviceType;

    private Long serviceItemId;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true)
    private BigDecimal unitPrice;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = false)
    private BigDecimal quantity;

    private ProductUnitType unitType;

    @DecimalMin(value = "0.00", inclusive = true)
    private BigDecimal taxRate;

    @DecimalMin(value = "0.00", inclusive = true)
    private BigDecimal taxAmount;

    private String descriptionOverride;

    private String metadataJson;

    @AssertTrue(message = "Para ítems de tipo PRODUCT debe especificarse productId y sólo para SERVICE se admite serviceType/serviceItemId")
    public boolean isValidCombination() {
        if (kind == null) {
            return false;
        }
        boolean hasProduct = productId != null;
        boolean hasService = serviceType != null && serviceItemId != null;
        boolean hasSaleMode = saleModeId != null;

        if (kind == SaleItemKind.PRODUCT) {
            return hasProduct && hasSaleMode && !hasService;
        }
        if (kind == SaleItemKind.SERVICE) {
            return !hasProduct && hasService;
        }
        return false;
    }
}
