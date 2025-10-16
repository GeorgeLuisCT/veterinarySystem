package com.gaedet.biocampovet.core.animal.util;

import com.gaedet.biocampovet.core.sales.dto.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ClinicalHistoryUtils {

    public static Map<String, List<SaleProductSummaryResponse>> groupSaleProductsByCategory(List<SaleProductSummaryResponse> products) {
        return products.stream()
                .collect(Collectors.groupingBy(SaleProductSummaryResponse::getProductName));
    }

}
