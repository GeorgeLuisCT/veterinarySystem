package com.gaedet.biocampovet.core.sales.mapper;

import com.gaedet.biocampovet.core.customer.entity.Customer;
import com.gaedet.biocampovet.core.sales.dto.response.SaleDetailResponse;
import com.gaedet.biocampovet.core.sales.dto.response.SalePaymentResponse;
import com.gaedet.biocampovet.core.sales.dto.response.SaleResponse;
import com.gaedet.biocampovet.core.sales.dto.response.SaleSummaryResponse;
import com.gaedet.biocampovet.core.sales.entity.Sale;
import com.gaedet.biocampovet.core.sales.entity.SaleDetail;
import com.gaedet.biocampovet.core.sales.entity.SalePayment;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public final class SaleMapper {

    public static SaleSummaryResponse toSummary(Sale sale) {
        if (sale == null) {
            return null;
        }

        String customerName = Optional.ofNullable(sale.getCustomer())
                .map(Customer::getName)
                .orElse(null);

        Long customerId = Optional.ofNullable(sale.getCustomer())
                .map(Customer::getId)
                .orElse(null);

        return SaleSummaryResponse.builder()
                .id(sale.getId())
                .documentType(sale.getDocumentType())
                .documentNumber(sale.getDocumentNumber())
                .status(sale.getStatus())
                .grandTotal(sale.getGrandTotal())
                .createdAt(sale.getCreatedAt())
                .branchId(sale.getBranch().getId())
                .sellerId(sale.getSeller().getId())
                .customerId(customerId)
                .customerName(customerName)
                .build();
    }

    public static SaleResponse toResponse(Sale sale) {
        List<SaleDetailResponse> details = sale.getDetails().stream()
                .map(SaleMapper::toDetailResponse)
                .collect(Collectors.toList());

        List<SalePaymentResponse> payments = sale.getPayments().stream()
                .map(SaleMapper::toPaymentResponse)
                .collect(Collectors.toList());

        Customer customer = sale.getCustomer();
        Long customerId = customer != null ? customer.getId() : null;
        String customerName = customer != null ? customer.getName() : null;

        return SaleResponse.builder()
                .id(sale.getId())
                .branchId(sale.getBranch().getId())
                .branchName(sale.getBranch().getName())
                .sellerId(sale.getSeller().getId())
                .sellerName(sale.getSeller().getEmployee().getFullName())
                .customerId(customerId)
                .customerName(customerName)
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

    public static SaleDetailResponse toDetailResponse(SaleDetail detail) {
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

    public static SalePaymentResponse toPaymentResponse(SalePayment payment) {
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
