package com.gaedet.biocampovet.core.sales.dto.response;

import com.gaedet.biocampovet.core.sales.enums.SaleStatus;
import com.gaedet.biocampovet.core.sales.enums.SalesDocumentType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class SaleSummaryResponse {
    Long id;
    SalesDocumentType documentType;
    String documentNumber;
    SaleStatus status;
    BigDecimal grandTotal;
    LocalDateTime createdAt;
    Long branchId;
    Long sellerId;
    Long customerId;
    String customerName;
}

