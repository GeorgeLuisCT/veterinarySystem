package com.gaedet.biocampovet.core.sales.dto.request;

import com.gaedet.biocampovet.core.sales.enums.SalesDocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSaleRequest {

    @Builder.Default
    private boolean finalizeSale = false;

    @NotNull
    private Long branchId;

    @NotNull
    private Long sellerId;

    private Long customerId;

    private SalesDocumentType documentType;

    private String documentNumber;

    @NotEmpty
    @Valid
    private List<SaleItemRequest> items;

    @Valid
    @Builder.Default
    private List<SalePaymentRequest> payments = new ArrayList<>();

    private String notes;
}