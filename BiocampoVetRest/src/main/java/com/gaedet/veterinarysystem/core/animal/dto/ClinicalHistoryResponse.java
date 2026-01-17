package com.gaedet.veterinarysystem.core.animal.dto;

import com.gaedet.veterinarysystem.core.sales.dto.SaleProductsGrouped;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClinicalHistoryResponse {
    private AnimalResponse animal;

    private SaleProductsGrouped saleProductsGrouped;
}
