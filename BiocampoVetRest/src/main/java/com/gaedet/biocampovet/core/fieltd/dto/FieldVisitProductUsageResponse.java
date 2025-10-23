package com.gaedet.biocampovet.core.fieltd.dto;

import com.gaedet.biocampovet.core.inventory.enums.ProductUnitType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldVisitProductUsageResponse {
    private Long id;
    private Long productId;
    private String productName;
    private ProductUnitType unit;
    private Integer quantityUsed;
    private Long vehicleId;
    private String vehicleName;
    private String notes;
}
