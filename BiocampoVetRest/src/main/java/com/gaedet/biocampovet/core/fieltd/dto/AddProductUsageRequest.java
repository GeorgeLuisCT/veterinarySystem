package com.gaedet.biocampovet.core.fieltd.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddProductUsageRequest {
    @NotNull
    private Long productId;
    @NotNull
    private ProductUnitType unit;
    @NotNull
    @Min(1)
    private Integer quantityUsed;
    private Long vehicleId; // fuente del insumo; si no se manda, usa el de la visita
    private String notes;
}
