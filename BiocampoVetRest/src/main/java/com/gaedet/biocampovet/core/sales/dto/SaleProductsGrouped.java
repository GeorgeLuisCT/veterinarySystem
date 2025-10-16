package com.gaedet.biocampovet.core.sales.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class SaleProductsGrouped {
    private Map<String, List<SaleProductSummaryResponse>> categories;
}
