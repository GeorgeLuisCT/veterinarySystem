package com.gaedet.biocampovet.core.sales.mapper;

import com.gaedet.biocampovet.core.sales.dto.response.SaleDetailResponse;
import com.gaedet.biocampovet.core.sales.dto.response.SalePaymentResponse;
import com.gaedet.biocampovet.core.sales.dto.response.SaleResponse;
import com.gaedet.biocampovet.core.sales.dto.response.SaleSummaryResponse;
import com.gaedet.biocampovet.core.sales.entity.Sale;
import com.gaedet.biocampovet.core.sales.entity.SaleDetail;
import com.gaedet.biocampovet.core.sales.entity.SalePayment;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class SaleMapper {

    public SaleSummaryResponse toSummary(Sale sale) {
        return SaleSummaryResponse.builder()
                .id(sale.getId())
                .documentType(sale.getDocumentType())
                .documentNumber(sale.getDocumentNumber())
                .status(sale.getStatus())
                .grandTotal(sale.getGrandTotal())
                .createdAt(sale.getCreatedAt())
                .branchId(sale.getBranch() != null ? sale.getBranch().getId() : null)
                .sellerId(sale.getSeller() != null ? sale.getSeller().getId() : null)
                .customerId(sale.getCustomer() != null ? sale.getCustomer().getId() : null)
                .build();
    }

    public SaleResponse toResponse(Sale sale) {
        List<SaleDetailResponse> details = sale.getDetails().stream()
                .map(this::toDetailResponse)
                .collect(Collectors.toList());

        List<SalePaymentResponse> payments = sale.getPayments().stream()
                .map(this::toPaymentResponse)
                .collect(Collectors.toList());

        return SaleResponse.builder()
                .id(sale.getId())
                .branchId(sale.getBranch() != null ? sale.getBranch().getId() : null)
                .sellerId(sale.getSeller() != null ? sale.getSeller().getId() : null)
                .customerId(sale.getCustomer() != null ? sale.getCustomer().getId() : null)
                .status(sale.getStatus())
                .documentType(sale.getDocumentType())
                .documentNumber(sale.getDocumentNumber())
                .subtotal(sale.getSubtotal())
                .taxTotal(sale.getTaxTotal())
                .grandTotal(sale.getGrandTotal())
                .createdAt(sale.getCreatedAt())
                .updatedAt(sale.getUpdatedAt())
                .voidedAt(sale.getVoidedAt())
                .voidReason(sale.getVoidReason())
                .sourceAttentionId(sale.getSourceAttentionId())
                .notes(sale.getNotes())
                .details(details)
                .payments(payments)
                .build();
    }

    public SaleDetailResponse toDetailResponse(SaleDetail detail) {
        return SaleDetailResponse.builder()
                .id(detail.getId())
                .description(detail.getItemDescription())
                .unitPrice(detail.getUnitPrice())
                .quantity(detail.getQuantity())
                .lineSubtotal(detail.getLineSubtotal())
                .taxRate(detail.getTaxRate())
                .taxAmount(detail.getTaxAmount())
                .productId(detail.getProduct() != null ? detail.getProduct().getId() : null)
                .productBatchId(detail.getProductBatch() != null ? detail.getProductBatch().getId() : null)
                .saleModeId(detail.getSaleMode() != null ? detail.getSaleMode().getId() : null)
                .unitType(detail.getUnitType())
                .quantityEquivalent(detail.getSaleMode() != null ? detail.getSaleMode().getQuantityEquivalent() : null)
                .serviceType(detail.getServiceType())
                .serviceItemId(detail.getServiceItemId())
                .metadataJson(detail.getMetadataJson())
                .build();
    }

    public SalePaymentResponse toPaymentResponse(SalePayment payment) {
        return SalePaymentResponse.builder()
                .id(payment.getId())
                .amount(payment.getAmountPaid())
                .method(payment.getPaymentMethod())
                .paidAt(payment.getPaidAt())
                .reference(payment.getPaymentReference())
                .notes(payment.getNotes())
                .cashSessionId(payment.getCashSession() != null ? payment.getCashSession().getId() : null)
                .build();
    }
}
