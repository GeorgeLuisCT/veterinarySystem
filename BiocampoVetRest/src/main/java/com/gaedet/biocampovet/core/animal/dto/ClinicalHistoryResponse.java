package com.gaedet.biocampovet.core.animal.dto;

import com.gaedet.biocampovet.core.sales.dto.SaleProductsGrouped;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClinicalHistoryResponse {
    private AnimalResponse animal;

    private SaleProductsGrouped saleProductsGrouped;
}
