package com.gaedet.biocampovet.core.sales.dto.response;

import com.gaedet.biocampovet.core.sales.enums.SaleStatus;
import com.gaedet.biocampovet.core.sales.enums.SalesDocumentType;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class SaleResponse {
    Long id;
    Long branchId;
    String branchName;
    Long sellerId;
    String sellerName;
    Long customerId;
    String customerName;
    SaleStatus status;
    SalesDocumentType documentType;
    String documentNumber;
    BigDecimal subtotal;
    BigDecimal taxTotal;
    BigDecimal grandTotal;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime voidedAt;
    String voidReason;
    Long sourceAttentionId;
    String notes;
    List<SaleDetailResponse> details;
    List<SalePaymentResponse> payments;
}

